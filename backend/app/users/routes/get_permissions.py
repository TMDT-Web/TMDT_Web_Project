# app/users/routes/get_permissions.py
from __future__ import annotations
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps, services
from app.users.models import User
from . import router

@router.get("/users/me/permissions", response_model=schemas.PermissionsResponse)
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.PermissionsResponse:
    perms = services.get_user_permissions(current_user)
    return schemas.PermissionsResponse(permissions=perms)
