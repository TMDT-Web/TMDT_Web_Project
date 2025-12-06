from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services

from . import category_router


@category_router.get("", response_model=list[schemas.CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[schemas.CategoryRead]:
    categories = services.list_categories(db)
    return [schemas.CategoryRead.model_validate(cat) for cat in categories]
