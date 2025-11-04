from __future__ import annotations

from fastapi import Depends

from app.users import schemas, dependencies as deps
from app.users.models import User

from . import router


@router.get("/users/me", response_model=schemas.UserRead)
def read_current_user(current_user: User = Depends(deps.get_current_active_user)) -> schemas.UserRead:
    return schemas.UserRead.model_validate(current_user)
