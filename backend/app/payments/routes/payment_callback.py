from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.payments import services
from app.payments.models import Payment, PaymentGatewayEnum

from . import router


@router.post("/{gateway}/callback")
async def payment_callback(
    gateway: PaymentGatewayEnum,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    services.initialize_gateways()
    gateway_impl = services.get_gateway(gateway)
    payload = await request.json()
    order_id = payload.get("order_id")
    payment_id = payload.get("payment_id")
    if not order_id or not payment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    status_result = await gateway_impl.handle_callback(db, payment, payload)
    return {"status": status_result.value}
