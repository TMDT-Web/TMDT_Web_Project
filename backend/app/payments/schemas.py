from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.payments.models import PaymentGatewayEnum, PaymentStatusEnum
from app.schemas.base import OrmBaseModel


class PaymentInitRequest(BaseModel):
    order_id: int
    gateway: PaymentGatewayEnum
    amount: Decimal
    currency: str = "VND"
    metadata: Optional[Dict[str, Any]] = None


class PaymentInitResponse(BaseModel):
    payment_id: int
    gateway: PaymentGatewayEnum
    status: PaymentStatusEnum
    redirect_url: Optional[str] = None
    qr_code: Optional[str] = None
    transaction_id: Optional[str] = None
    additional_data: Dict[str, Any] = {}


class PaymentRead(OrmBaseModel):
    id: int
    order_id: int
    gateway: PaymentGatewayEnum
    amount: Decimal
    currency: str
    status: PaymentStatusEnum
    transaction_id: Optional[str]
    provider_response: Optional[str]
    failure_reason: Optional[str]
    payload: Optional[dict]
    created_at: datetime
    updated_at: datetime
