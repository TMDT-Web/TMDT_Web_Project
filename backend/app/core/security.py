# app/core/security.py
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Literal, TypedDict, Dict

from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import argon2

from app.core import config

# ----- OAuth2 password flow (Swagger "Authorize") -----
# trùng đúng đường dẫn login của bạn: /api/auth/login
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{config.settings.api_prefix}/auth/login",
    auto_error=False,   # để mình tự raise lỗi có thông điệp rõ ràng
)

# ----- JWT config -----
ALGORITHM: str = "HS256"
SECRET_KEY: str = config.settings.jwt_secret_key  # ENV: JWT_SECRET_KEY

# TTL (đọc từ .env nếu có, fallback mặc định)
ACCESS_EXPIRES_MIN: int = getattr(config.settings, "access_token_expire_minutes", 60)
REFRESH_EXPIRES_DAYS: int = getattr(config.settings, "refresh_token_expire_days", 7)


class TokenPayload(TypedDict, total=False):
    sub: str
    type: Literal["access", "refresh"]
    exp: int


# =========================
# Password hashing
# =========================
def get_password_hash(raw: str) -> str:
    return argon2.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return argon2.verify(raw, hashed)
    except Exception:
        return False


# =========================
# JWT helpers
# =========================
def _encode(payload: Dict, expires_delta: timedelta) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    # jose hỗ trợ datetime UTC trực tiếp cho "exp"
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _encode({"sub": str(user_id), "type": "access"},
                   timedelta(minutes=ACCESS_EXPIRES_MIN))


def create_refresh_token(user_id: int) -> str:
    return _encode({"sub": str(user_id), "type": "refresh"},
                   timedelta(days=REFRESH_EXPIRES_DAYS))


def create_access_token_pair(user_id: int) -> Dict[str, str]:
    """
    Trả về cặp JWT chuẩn cho client (access + refresh).
    """
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }


def decode_token(
    token: str,
    *,
    expected_type: Optional[Literal["access", "refresh"]] = "access",
) -> TokenPayload:
    # Mặc định 401 theo chuẩn OAuth2
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        # chữ ký sai / token hỏng / hết hạn
        raise cred_exc

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.isdigit():
        # sub phải là user_id dạng chuỗi số
        raise cred_exc

    tok_type = payload.get("type")
    if expected_type and tok_type != expected_type:
        # ví dụ cố dùng refresh token để gọi API protected
        raise cred_exc

    return {"sub": sub, "type": tok_type}
