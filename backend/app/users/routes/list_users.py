from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, dependencies as deps
from app.users.models import User

from . import router


@router.get("/users", response_model=list[schemas.UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.UserRead]:
    users = db.query(User).all()
    return [schemas.UserRead.model_validate(user) for user in users]
