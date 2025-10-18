from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.orders.models import OrderPaymentStatusEnum, OrderStatusEnum
from app.payments.models import PaymentGatewayEnum, PaymentStatusEnum
from app.payments.schemas import PaymentInitResponse
from app.schemas.base import OrmBaseModel


class OrderItemRead(OrmBaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderCreate(BaseModel):
    shipping_address: str
    shipping_contact_name: str
    shipping_contact_phone: str
    notes: Optional[str] = None
    payment_gateway: PaymentGatewayEnum
    voucher_code: Optional[str] = None
    use_reward_points: bool = False


class OrderRead(OrmBaseModel):
    id: int
    order_number: str
    status: OrderStatusEnum
    payment_status: OrderPaymentStatusEnum
    total_amount: Decimal
    reward_points_used: int
    reward_points_earned: int
    voucher_code: Optional[str]
    shipping_address: str
    shipping_contact_name: str
    shipping_contact_phone: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead]


class OrderListResponse(OrmBaseModel):
    items: List[OrderRead]
    total: int
    page: int
    size: int


class OrderCreateResponse(BaseModel):
    order: OrderRead
    payment: Optional[PaymentInitResponse] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum
    notes: Optional[str] = None


class PaymentStatusUpdate(BaseModel):
    payment_status: PaymentStatusEnum


class OrderMetrics(OrmBaseModel):
    total_orders: int
    total_revenue: Decimal
    total_customers: int
