from __future__ import annotations

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import router
from app.core.database import get_db
from app.users import services
from app.core.security import create_access_token_pair


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")  # không đặt response_model để khỏi vướng validate
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập bằng email/password.
    Trả về cùng shape với logic cũ:
    {
      "user": <UserRead>,
      "access_token": "...",
      "refresh_token": "...",
      "token_type": "bearer"
    }
    """
    try:
        user = services.authenticate_user(db, payload.email, payload.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    tokens = create_access_token_pair(user.id)  # {"access_token", "refresh_token", "token_type"}
    user_read = services.to_user_read(user).model_dump()

    return {
        "user": user_read,
        **tokens,
    }
