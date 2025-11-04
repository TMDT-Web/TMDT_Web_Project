from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.payments import schemas, services
from app.payments.models import PaymentGatewayEnum
from app.orders.models import Order
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("/initiate", response_model=schemas.PaymentInitResponse, status_code=status.HTTP_201_CREATED)
async def initiate_payment(
    payload: schemas.PaymentInitRequest,
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> schemas.PaymentInitResponse:
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    payment, response = await services.initiate_with_fallback(
        db,
        order=order,
        preferred_gateway=payload.gateway,
        amount=float(payload.amount),
        metadata=payload.metadata,
    )
    return schemas.PaymentInitResponse(
        payment_id=payment.id,
        gateway=response.gateway,
        status=response.status,
        redirect_url=response.redirect_url,
        qr_code=response.qr_code,
        transaction_id=response.transaction_id,
        additional_data=response.additional_data,
    )
