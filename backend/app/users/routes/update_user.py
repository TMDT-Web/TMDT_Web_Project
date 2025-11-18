from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps, services
from app.users.models import User
from . import router


def _apply_updates(user: User, payload: schemas.UserUpdate, db: Session) -> User:
    # Cập nhật thông tin cơ bản (giữ nguyên logic cũ)
    if payload.email is not None:
        user.email = payload.email.strip().lower()
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.is_active is not None:
        user.is_active = payload.is_active

    # Cập nhật vai trò nếu có
    if payload.role_ids is not None:
        services.assign_roles_by_ids(db, user, payload.role_ids)

    # Đổi mật khẩu nếu API của bạn gom ở đây
    if payload.password:
        # tuỳ dự án bạn dùng set_password / hash ở chỗ khác.
        from app.core.security import get_password_hash
        user.password_hash = get_password_hash(payload.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=schemas.UserRead)
def patch_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),   # giữ nguyên ý: chỉ admin
) -> schemas.UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated = _apply_updates(user, payload, db)
    return schemas.UserRead.model_validate(updated)


@router.put("/users/{user_id:int}", response_model=schemas.UserRead)
def put_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),   # giữ nguyên ý: chỉ admin
) -> schemas.UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated = _apply_updates(user, payload, db)
    return schemas.UserRead.model_validate(updated)


# =========================
# ALIAS ENDPOINTS cho trang Roles (để không còn 404)
# =========================

@router.put("/admin/users/{user_id}/role", response_model=schemas.UserRead)
def admin_update_user_role(
    user_id: int,
    payload: schemas.AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),
) -> schemas.UserRead:
    """
    Alias cho UI cũ: PUT /api/admin/users/{id}/role
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    services.assign_roles_by_ids(db, user, payload.role_ids)
    db.commit()
    db.refresh(user)
    return schemas.UserRead.model_validate(user)


@router.post("/roles/assign", response_model=schemas.UserRead)
def assign_roles_bulk(
    payload: schemas.RoleAssignRequest,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),
) -> schemas.UserRead:
    """
    Alias cho UI cũ: POST /api/roles/assign
    """
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    services.assign_roles_by_ids(db, user, payload.role_ids)
    db.commit()
    db.refresh(user)
    return schemas.UserRead.model_validate(user)
