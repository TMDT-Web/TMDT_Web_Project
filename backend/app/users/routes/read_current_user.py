# app/users/routes/read_current_user.py
from __future__ import annotations

from fastapi import Depends
from app.users import schemas, dependencies as deps  # thêm services
from app.users.models import User

from . import router


@router.get("/users/me", response_model=schemas.UserRead)
def read_current_user(
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.UserRead:
    # Giữ nguyên như cũ
    return schemas.UserRead.model_validate(current_user)


@router.get("/users/me/permissions", response_model=list[str])
def read_my_permissions(
    current_user: User = Depends(deps.get_current_active_user),
) -> list[str]:
    """
    Trả về danh sách permissions động cho user hiện tại.
    - root  -> ["*"]
    - admin (trong DB, dùng như 'manager') -> ["manager:*"]
    - staff -> ["staff:*"]
    - customer -> []
    """
    return services.get_permissions_for_user(current_user)
