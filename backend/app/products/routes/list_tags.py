from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services

from . import tag_router


@tag_router.get("", response_model=list[schemas.TagRead])
def list_tags(db: Session = Depends(get_db)) -> list[schemas.TagRead]:
    tags = services.list_tags(db)
    return [schemas.TagRead.model_validate(tag) for tag in tags]
