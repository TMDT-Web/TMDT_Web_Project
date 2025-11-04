from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services, dependencies as deps
from app.users.models import User

from . import router


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
