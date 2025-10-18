from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.payments import schemas, services
from app.payments.models import Payment, PaymentGatewayEnum
from app.orders.models import Order
from app.users import dependencies as deps
from app.users.models import User

router = APIRouter(prefix="/payments", tags=["Payments"])


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


@router.get("", response_model=list[schemas.PaymentRead])
def list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.PaymentRead]:
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    return [schemas.PaymentRead.model_validate(payment) for payment in payments]
