from __future__ import annotations

import secrets
from datetime import datetime
from typing import Iterable, Optional

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import config, security
from app.users import schemas
from app.users.models import Role, User, UserAddress
from app.rewards.models import RewardPoint


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.execute(select(User).where(User.google_id == google_id)).scalar_one_or_none()


def create_user(db: Session, payload: schemas.UserCreate, default_roles: Iterable[str] | None = None) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # guard against edge cases where encoded length slips past schema validation
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at most 72 bytes when encoded as UTF-8.",
        )

    user = User(
        email=payload.email,
        password_hash=security.get_password_hash(payload.password),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        is_active=True,
    )
    db.add(user)
    db.flush()

    if default_roles:
        assign_roles_by_name(db, user, default_roles)

    ensure_reward_point_account(db, user)

    db.commit()
    db.refresh(user)
    return user


def ensure_reward_point_account(db: Session, user: User) -> RewardPoint:
    reward_point = db.execute(
        select(RewardPoint).where(RewardPoint.user_id == user.id)
    ).scalar_one_or_none()
    if not reward_point:
        reward_point = RewardPoint(user_id=user.id, points=0, tier="standard")
        db.add(reward_point)
        db.flush()
    return reward_point


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not security.verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user


def issue_token_pair(user: User) -> schemas.TokenPair:
    role_names = [role.name for role in user.roles]
    access_token = security.create_access_token(str(user.id), roles=role_names)
    refresh_token = security.create_refresh_token(str(user.id))
    return schemas.TokenPair(access_token=access_token, refresh_token=refresh_token)


def assign_roles_by_name(db: Session, user: User, role_names: Iterable[str]) -> None:
    existing_roles = db.execute(select(Role).where(Role.name.in_(list(role_names)))).scalars().all()
    missing = set(role_names) - {role.name for role in existing_roles}
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Roles not found: {', '.join(missing)}",
        )
    for role in existing_roles:
        if role not in user.roles:
            user.roles.append(role)
    db.flush()


def assign_roles_by_ids(db: Session, user: User, role_ids: Iterable[int]) -> None:
    roles = db.execute(select(Role).where(Role.id.in_(list(role_ids)))).scalars().all()
    if len(roles) != len(set(role_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more roles not found")
    user.roles = roles
    db.flush()


def create_role(db: Session, payload: schemas.RoleCreate) -> Role:
    role = Role(name=payload.name, description=payload.description, is_system=payload.is_system)
    db.add(role)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role already exists") from exc
    db.refresh(role)
    return role


def ensure_system_roles(db: Session) -> None:
    default_roles = [
        ("root", "Super administrator with full access", True),
        ("admin", "Administrator with management privileges", True),
        ("staff", "Staff user with restricted permissions", False),
        ("customer", "Default role for customers", False),
    ]
    for name, description, is_system in default_roles:
        if not db.execute(select(Role).where(Role.name == name)).scalar_one_or_none():
            db.add(Role(name=name, description=description, is_system=is_system))
    db.commit()


async def init_google_oauth(state: Optional[str] = None) -> schemas.GoogleAuthInitResponse:
    if not config.settings.google_client_id or not config.settings.google_redirect_uri:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth not configured")
    generated_state = state or secrets.token_urlsafe(16)
    params = {
        "client_id": config.settings.google_client_id,
        "redirect_uri": str(config.settings.google_redirect_uri),
        "response_type": "code",
        "scope": "openid email profile",
        "state": generated_state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    query = str(httpx.QueryParams(params))
    authorization_url = f"https://accounts.google.com/o/oauth2/v2/auth?{query}"
    return schemas.GoogleAuthInitResponse(authorization_url=authorization_url, state=generated_state)


async def exchange_google_code(db: Session, code: str) -> tuple[User, bool]:
    if not (
        config.settings.google_client_id
        and config.settings.google_client_secret
        and config.settings.google_redirect_uri
    ):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth not configured")

    token_endpoint = "https://oauth2.googleapis.com/token"
    userinfo_endpoint = "https://openidconnect.googleapis.com/v1/userinfo"

    async with httpx.AsyncClient(timeout=10) as client:
        token_response = await client.post(
            token_endpoint,
            data={
                "code": code,
                "client_id": config.settings.google_client_id,
                "client_secret": config.settings.google_client_secret,
                "redirect_uri": str(config.settings.google_redirect_uri),
                "grant_type": "authorization_code",
            },
        )
        token_response.raise_for_status()
        token_data = token_response.json()

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token exchange failed")

        userinfo_response = await client.get(
            userinfo_endpoint,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo_response.raise_for_status()
        userinfo = userinfo_response.json()

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    full_name = userinfo.get("name")

    if not google_id or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google profile incomplete")

    user = get_user_by_google_id(db, google_id)
    created = False
    if not user:
        user = get_user_by_email(db, email)
        if user:
            user.google_id = google_id
        else:
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                is_active=True,
            )
            db.add(user)
            db.flush()
            assign_roles_by_name(db, user, ["customer"])
            ensure_reward_point_account(db, user)
            created = True
    db.commit()
    db.refresh(user)
    return user, created


def create_address(db: Session, user: User, payload: schemas.UserAddressCreate) -> UserAddress:
    if payload.is_default:
        db.query(UserAddress).filter(UserAddress.user_id == user.id).update({"is_default": False})
    address = UserAddress(
        user_id=user.id,
        label=payload.label,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        address_line=payload.address_line,
        ward=payload.ward,
        district=payload.district,
        city=payload.city,
        country=payload.country,
        is_default=payload.is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address
