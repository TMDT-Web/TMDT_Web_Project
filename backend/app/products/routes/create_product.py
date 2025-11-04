from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.ProductRead:
    product = services.create_product(db, payload)
    return schemas.ProductRead.model_validate(product)
