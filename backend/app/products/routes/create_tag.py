from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import tag_router


@tag_router.post("", response_model=schemas.TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: schemas.TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.TagRead:
    tag = services.create_tag(db, payload)
    return schemas.TagRead.model_validate(tag)
