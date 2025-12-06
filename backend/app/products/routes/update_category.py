from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import category_router


@category_router.put("/{category_id}", response_model=schemas.CategoryRead)
def update_category(
    category_id: int,
    payload: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.CategoryRead:
    category = services.update_category(db, category_id, payload)
    return schemas.CategoryRead.model_validate(category)
