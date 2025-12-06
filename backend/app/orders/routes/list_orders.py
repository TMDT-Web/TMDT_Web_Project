from __future__ import annotations

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orders import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.get("", response_model=schemas.OrderListResponse)
def list_orders(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderListResponse:
    orders, total = services.get_orders_for_user(db, current_user, page, size)
    return schemas.OrderListResponse(
        items=[schemas.OrderRead.model_validate(order) for order in orders],
        total=total,
        page=page,
        size=size,
    )
