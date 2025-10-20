from datetime import datetime, timedelta
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException, status

from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings


# use argon2 to avoid bcrypt 72-byte limit issues
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/login")


class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    type: str = "access"
    roles: list[str] = []


def create_token(
    subject: str,
    expires_delta: timedelta,
    secret_key: str,
    token_type: str,
    extra_claims: Dict[str, Any] | None = None,
) -> str:
    to_encode: Dict[str, Any] = {
        "exp": datetime.utcnow() + expires_delta,
        "sub": str(subject),
        "type": token_type,
    }
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_access_token(subject: str, roles: list[str] | None = None) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(
        subject=subject,
        expires_delta=expires_delta,
        secret_key=settings.jwt_secret_key,
        token_type="access",
        extra_claims={"roles": roles or []},
    )


def create_refresh_token(subject: str) -> str:
    expires_delta = timedelta(minutes=settings.refresh_token_expire_minutes)
    return create_token(
        subject=subject,
        expires_delta=expires_delta,
        secret_key=settings.jwt_refresh_secret_key,
        token_type="refresh",
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def decode_token(token: str, is_refresh: bool = False) -> TokenPayload:
    secret = settings.jwt_refresh_secret_key if is_refresh else settings.jwt_secret_key
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc
    token_type = payload.get("type")
    if is_refresh and token_type != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    if not is_refresh and token_type != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    return token_data
