# app/dependencies.py
from __future__ import annotations
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

# Re-export get_db để các route import thống nhất từ đây
from app.core.database import get_db

from app.users.models import User
from app.users.services import compute_user_permission_map
from app.core.security import TokenPayload, decode_token  # bỏ oauth2_scheme ở đây


def _pick_token_from_request(request: Request) -> Optional[str]:
    """
    Ưu tiên Header Authorization: Bearer <token>.
    Nếu không có, thử lấy từ cookie 'access_token' (nếu bạn set cookie phía login).
    """
    auth: str = request.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()

    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token.strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    - Lấy token từ Authorization header / cookie.
    - Giải mã JWT (type=access).
    - Tải user từ DB.
    """
    token = _pick_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload: TokenPayload = decode_token(token, expected_type="access")

    user = db.execute(
        select(User).where(User.id == int(payload["sub"]))
    ).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User inactive"
        )
    return current_user


def require_roles(*role_names: str) -> Callable[[User], User]:
    """
    Yêu cầu user có ÍT NHẤT MỘT vai trò trong danh sách.
    BÁM DB: admin / manager / customer.
    ROOT user luôn bypass (có mọi quyền).
    """
    required = {r.strip().lower() for r in role_names if r and r.strip()}

    def _checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_roles = {r.name.strip().lower() for r in (current_user.roles or [])}
        
        # ROOT bypass - root có mọi quyền
        if "root" in user_roles:
            return current_user
        
        if required and not (required & user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role"
            )
        return current_user

    return _checker


# Shortcut guards phù hợp DB
AdminOnly = require_roles("admin")
AdminOrManager = require_roles("admin", "manager")


def require_permission(code: str):
    """
    Kiểm tra permission theo compute_user_permission_map(db, user).
    ROOT user luôn bypass (có mọi quyền).
    Nếu chưa có bảng permissions → guard này không chặn,
    kiểm soát truy cập dựa theo role dùng AdminOnly/AdminOrManager.
    """
    code_norm = (code or "").strip()

    def _wrap(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db),
    ) -> User:
        # ROOT bypass - root có mọi quyền
        user_roles = {r.name.strip().lower() for r in (current_user.roles or [])}
        if "root" in user_roles:
            return current_user
        
        if not code_norm:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission code not configured",
            )
        perm_result = compute_user_permission_map(db, current_user)
        allowed = bool(perm_result.get(code_norm, {}).get("allowed", False))
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied"
            )
        return current_user

    return _wrap
