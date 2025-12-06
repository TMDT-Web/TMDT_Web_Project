from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.products import schemas, services

from . import router


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> schemas.ProductRead:
    product = services.get_product(db, product_id)
    return schemas.ProductRead.model_validate(product)
