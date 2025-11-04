from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.inventory import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("/stock-entries", response_model=schemas.PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> schemas.PurchaseOrderRead:
    purchase_order = services.create_purchase_order(db, payload)
    return schemas.PurchaseOrderRead.model_validate(purchase_order)
