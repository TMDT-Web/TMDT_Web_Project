from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orders import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("", response_model=schemas.OrderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.OrderCreateResponse:
    order, payment_response = await services.create_order(db, current_user, payload)
    return schemas.OrderCreateResponse(
        order=schemas.OrderRead.model_validate(order),
        payment=payment_response,
    )
