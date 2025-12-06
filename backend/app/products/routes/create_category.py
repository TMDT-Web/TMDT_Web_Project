from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import category_router


@category_router.post("", response_model=schemas.CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.CategoryRead:
    category = services.create_category(db, payload)
    return schemas.CategoryRead.model_validate(category)
