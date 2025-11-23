"""
Order Schemas - Enhanced for Furniture E-commerce
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.base import TimestampSchema
from app.models.order import OrderStatus, PaymentMethod


class OrderItemBase(BaseModel):
    """Order item base schema"""
    product_id: int
    quantity: int = Field(..., gt=0)
    variant: Optional[str] = None  # Màu sắc, kích thước variant


class OrderItemCreate(OrderItemBase):
    """Order item create schema"""
    pass


class OrderItemResponse(TimestampSchema):
    """Order item response"""
    order_id: int
    product_id: int
    product_name: str
    price_at_purchase: float
    quantity: int
    variant: Optional[str] = None


class OrderBase(BaseModel):
    """Order base schema"""
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=20)
    shipping_address: str = Field(..., min_length=10)
    payment_method: PaymentMethod
    note: Optional[str] = None


class OrderCreate(OrderBase):
    """Order create schema"""
    items: List[OrderItemCreate]
    deposit_amount: Optional[float] = 0  # Số tiền cọc (nếu có)


class OrderUpdate(BaseModel):
    """Order update schema (admin)"""
    status: Optional[OrderStatus] = None
    cancellation_reason: Optional[str] = None
    is_paid: Optional[bool] = None
    shipping_fee: Optional[float] = None


class OrderResponse(TimestampSchema, OrderBase):
    """Order response schema"""
    user_id: int
    
    # Financial info
    subtotal: float
    shipping_fee: float
    discount_amount: float
    total_amount: float
    deposit_amount: float
    remaining_amount: float
    is_paid: bool
    
    # Status
    status: OrderStatus
    cancellation_reason: Optional[str] = None
    
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Order list response"""
    orders: List[OrderResponse]
    total: int
