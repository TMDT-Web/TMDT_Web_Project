from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services, dependencies as deps
from app.users.models import User

from . import router


@router.post("/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("root")),
) -> schemas.RoleRead:
    role = services.create_role(db, payload)
    return schemas.RoleRead.model_validate(role)
