from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orders import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("/{order_id}/cancel", response_model=schemas.OrderRead)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderRead:
    order = services.get_order(db, order_id)
    if order.user_id != current_user.id:
        deps.require_roles("admin", "root")(current_user)
    order = services.cancel_order(db, order, order.user)
    return schemas.OrderRead.model_validate(order)
