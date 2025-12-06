from __future__ import annotations

from collections import OrderedDict
from typing import Dict, Iterable, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.orders.models import Order
from app.payments import schemas
from app.payments.models import Payment, PaymentGatewayEnum, PaymentStatusEnum


class PaymentGateway:
    gateway: PaymentGatewayEnum

    async def initiate_payment(
        self,
        db: Session,
        payment: Payment,
        metadata: dict | None = None,
    ) -> schemas.PaymentInitResponse:
        raise NotImplementedError

    async def handle_callback(self, db: Session, payment: Payment, data: dict) -> PaymentStatusEnum:
        raise NotImplementedError


gateway_registry: Dict[PaymentGatewayEnum, PaymentGateway] = OrderedDict()


def register_gateway(gateway: PaymentGateway) -> None:
    gateway_registry[gateway.gateway] = gateway


def get_gateway(gateway: PaymentGatewayEnum) -> PaymentGateway:
    if gateway not in gateway_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment gateway {gateway} not configured",
        )
    return gateway_registry[gateway]


class SimulatedOnlineGateway(PaymentGateway):
    def __init__(self, gateway: PaymentGatewayEnum):
        self.gateway = gateway

    async def initiate_payment(
        self,
        db: Session,
        payment: Payment,
        metadata: dict | None = None,
    ) -> schemas.PaymentInitResponse:
        redirect_url = f"https://pay.{self.gateway.value}.example/checkout/{payment.id}"
        additional = metadata or {}
        additional["note"] = "Simulated payment link. Replace with real integration."
        return schemas.PaymentInitResponse(
            payment_id=payment.id,
            gateway=self.gateway,
            status=PaymentStatusEnum.PENDING,
            redirect_url=redirect_url,
            additional_data=additional,
        )

    async def handle_callback(self, db: Session, payment: Payment, data: dict) -> PaymentStatusEnum:
        payment.status = PaymentStatusEnum.SUCCESS
        payment.transaction_id = data.get("transaction_id")
        payment.provider_response = str(data)
        db.commit()
        return payment.status


class CashOnDeliveryGateway(PaymentGateway):
    gateway = PaymentGatewayEnum.COD

    async def initiate_payment(
        self,
        db: Session,
        payment: Payment,
        metadata: dict | None = None,
    ) -> schemas.PaymentInitResponse:
        payment.status = PaymentStatusEnum.SUCCESS
        db.commit()
        return schemas.PaymentInitResponse(
            payment_id=payment.id,
            gateway=self.gateway,
            status=PaymentStatusEnum.SUCCESS,
            additional_data={"message": "Cash payment will be collected upon delivery."},
        )

    async def handle_callback(self, db: Session, payment: Payment, data: dict) -> PaymentStatusEnum:
        return payment.status


def initialize_gateways() -> None:
    if gateway_registry:
        return
    register_gateway(SimulatedOnlineGateway(PaymentGatewayEnum.MOMO))
    register_gateway(SimulatedOnlineGateway(PaymentGatewayEnum.ZALOPAY))
    register_gateway(SimulatedOnlineGateway(PaymentGatewayEnum.VNPAY))
    register_gateway(SimulatedOnlineGateway(PaymentGatewayEnum.GOOGLE_PAY))
    register_gateway(CashOnDeliveryGateway())


DEFAULT_PAYMENT_PRIORITY = [
    PaymentGatewayEnum.MOMO,
    PaymentGatewayEnum.ZALOPAY,
    PaymentGatewayEnum.VNPAY,
    PaymentGatewayEnum.GOOGLE_PAY,
]


async def initiate_with_fallback(
    db: Session,
    order: Order,
    preferred_gateway: PaymentGatewayEnum,
    amount: float,
    metadata: dict | None = None,
) -> Tuple[Payment, schemas.PaymentInitResponse]:
    initialize_gateways()

    priority: list[PaymentGatewayEnum] = [preferred_gateway]
    for gateway in DEFAULT_PAYMENT_PRIORITY:
        if gateway not in priority:
            priority.append(gateway)
    if PaymentGatewayEnum.COD not in priority:
        priority.append(PaymentGatewayEnum.COD)

    last_error: Exception | None = None
    for gateway_enum in priority:
        gateway = get_gateway(gateway_enum)
        payment = Payment(
            order_id=order.id,
            gateway=gateway_enum,
            amount=amount,
            status=PaymentStatusEnum.PENDING,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        try:
            response = await gateway.initiate_payment(db, payment, metadata)
            payment.payload = response.additional_data
            payment.status = response.status
            if response.transaction_id:
                payment.transaction_id = response.transaction_id
            db.commit()
            return payment, response
        except Exception as exc:  # pragma: no cover
            last_error = exc
            payment.status = PaymentStatusEnum.FAILED
            payment.failure_reason = str(exc)
            db.commit()
            continue

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="All payment gateways failed" if not last_error else str(last_error),
    )
