from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps
from app.users.models import Role, User

from . import router


@router.get("/roles", response_model=list[schemas.RoleRead])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.RoleRead]:
    roles = db.query(Role).order_by(Role.name).all()
    return [schemas.RoleRead.model_validate(role) for role in roles]
