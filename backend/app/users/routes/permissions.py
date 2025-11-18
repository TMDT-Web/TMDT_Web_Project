from __future__ import annotations

from typing import List

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps
from app.users.models import User, Role, Permission
from . import router


@router.get("/permissions", response_model=List[schemas.PermissionRead])
def list_permissions(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),  # đổi root -> admin
) -> List[schemas.PermissionRead]:
    perms = db.query(Permission).order_by(Permission.code).all()
    return [schemas.PermissionRead.model_validate(p) for p in perms]


@router.get("/roles/{role_id}/permissions", response_model=List[schemas.PermissionRead])
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),  # đổi root -> admin
) -> List[schemas.PermissionRead]:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return [schemas.PermissionRead.model_validate(p) for p in role.permissions]


class RolePermissionUpdate(schemas.BaseModel):
    permission_ids: list[int]


@router.put("/roles/{role_id}/permissions", response_model=List[schemas.PermissionRead])
def set_role_permissions(
    role_id: int,
    payload: RolePermissionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin")),  # đổi root -> admin
) -> List[schemas.PermissionRead]:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    perms = db.query(Permission).filter(Permission.id.in_(payload.permission_ids)).all()

    role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)

    return [schemas.PermissionRead.model_validate(p) for p in role.permissions]
