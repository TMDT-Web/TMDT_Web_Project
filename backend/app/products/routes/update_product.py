from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.patch("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.ProductRead:
    product = services.update_product(db, product_id, payload)
    return schemas.ProductRead.model_validate(product)
