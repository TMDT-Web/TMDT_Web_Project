from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps
from app.users.models import User

from . import router


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
