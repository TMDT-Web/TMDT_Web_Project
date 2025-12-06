from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from starlette.responses import RedirectResponse

from app.core import config
from app.core.database import get_db
from app.core.security import decode_token
from app.users import dependencies as deps
from app.users import schemas, services
from app.users.models import Role, User

router = APIRouter(tags=["Users", "Auth"])


@router.post("/auth/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> schemas.UserRead:
    services.ensure_system_roles(db)
    user = services.create_user(db, payload, default_roles=["customer"])
    return schemas.UserRead.model_validate(user)


@router.post("/auth/login", response_model=schemas.TokenPair)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenPair:
    user = services.authenticate_user(db, payload.email, payload.password)
    return services.issue_token_pair(user)


@router.post("/auth/refresh", response_model=schemas.TokenPair)
def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
) -> schemas.TokenPair:
    payload = decode_token(refresh_token, is_refresh=True)
    user = db.get(User, int(payload.sub))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return services.issue_token_pair(user)


@router.get("/auth/google/login", response_class=RedirectResponse, status_code=307, name="auth:google-login")
def google_oauth_login() -> RedirectResponse:
    """
    Generate Google OAuth2 URL and redirect the user.
    """
    if not all([config.settings.google_client_id, config.settings.google_redirect_uri]):
        raise HTTPException(status_code=500, detail="Google OAuth2 is not configured")

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"scope=openid%20email%20profile&"
        f"response_type=code&"
        f"redirect_uri={config.settings.google_redirect_uri}&"
        f"client_id={config.settings.google_client_id}"
    )
    return RedirectResponse(url=auth_url)


@router.get("/auth/google/callback", response_model=schemas.GoogleAuthCallbackResponse)
async def google_oauth_callback(code: str, db: Session = Depends(get_db)) -> schemas.GoogleAuthCallbackResponse:
    user, created = await services.exchange_google_code(db, code)
    token_pair = services.issue_token_pair(user)
    return schemas.GoogleAuthCallbackResponse(**token_pair.model_dump(), is_new_user=created)


@router.get("/users/me", response_model=schemas.UserRead)
def read_current_user(current_user: User = Depends(deps.get_current_active_user)) -> schemas.UserRead:
    return schemas.UserRead.model_validate(current_user)


@router.get("/users", response_model=list[schemas.UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.UserRead]:
    users = db.query(User).all()
    return [schemas.UserRead.model_validate(user) for user in users]


@router.get("/users/{user_id}", response_model=schemas.UserRead)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if current_user.id != user_id and "root" not in {role.name for role in current_user.roles}:
        deps.require_roles("admin")(current_user)  # raises if no permission
    return schemas.UserRead.model_validate(user)


@router.patch("/users/{user_id}", response_model=schemas.UserRead)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.UserRead:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # allow self-update for personal info; admin/root for others
    if current_user.id != user_id:
        deps.require_roles("admin", "root")(current_user)

    if payload.full_name is not None:
        target.full_name = payload.full_name
    if payload.phone_number is not None:
        target.phone_number = payload.phone_number
    if payload.is_active is not None:
        deps.require_roles("admin", "root")(current_user)
        target.is_active = payload.is_active
    if payload.role_ids is not None:
        deps.require_roles("admin", "root")(current_user)
        services.assign_roles_by_ids(db, target, payload.role_ids)

    db.commit()
    db.refresh(target)
    return schemas.UserRead.model_validate(target)


@router.post("/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("root")),
) -> schemas.RoleRead:
    role = services.create_role(db, payload)
    return schemas.RoleRead.model_validate(role)


@router.get("/roles", response_model=list[schemas.RoleRead])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.RoleRead]:
    roles = db.query(Role).order_by(Role.name).all()
    return [schemas.RoleRead.model_validate(role) for role in roles]


@router.post("/users/me/addresses", response_model=schemas.UserAddressRead, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: schemas.UserAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.UserAddressRead:
    address = services.create_address(db, current_user, payload)
    return schemas.UserAddressRead.model_validate(address)
