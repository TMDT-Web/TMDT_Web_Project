from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.inventory import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.get("/stock-entries", response_model=list[schemas.PurchaseOrderRead])
def list_purchase_orders(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root", "staff")),
) -> list[schemas.PurchaseOrderRead]:
    purchase_orders = services.list_purchase_orders(db)
    return [schemas.PurchaseOrderRead.model_validate(po) for po in purchase_orders]
