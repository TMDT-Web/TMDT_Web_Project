from __future__ import annotations

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

from . import router
from app.core.database import get_db
from app.users import services
from app.core.security import create_access_token_pair


@router.get("/auth/google/callback")  # không đặt response_model để khỏi vướng validate
def google_oauth_callback(
    code: str = Query(..., description="Google auth code"),
    db: Session = Depends(get_db),
):
    """
    Nhận code từ Google, tạo/đăng nhập user và trả về:
    {
      "user": <UserRead>,
      "access_token": "...",
      "refresh_token": "...",
      "token_type": "bearer"
    }
    """
    try:
        user = services.exchange_google_code(db, code)  # hàm của bạn: lấy info Google & upsert user
    except Exception as e:  # lỗi khi đổi code lấy token/userinfo
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth exchange failed: {e}",
        ) from e

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not resolve Google account",
        )

    tokens = create_access_token_pair(user.id)
    user_read = services.to_user_read(user).model_dump()

    return {"user": user_read, **tokens}
