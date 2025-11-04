from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orders import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import admin_router


@admin_router.patch("/{order_id}/status", response_model=schemas.OrderRead)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.OrderRead:
    order = services.get_order(db, order_id)
    order = services.update_order_status(db, order, payload)
    return schemas.OrderRead.model_validate(order)
