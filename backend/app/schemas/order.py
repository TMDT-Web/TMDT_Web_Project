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
    collection_id: Optional[int] = None  # Track if item is part of a collection


class OrderItemCreate(OrderItemBase):
    """Order item create schema"""
    is_collection: bool = False  # Explicitly mark if this is a collection to prevent ID collision
    price_override: Optional[float] = None  # Used for collection items to preserve bundle pricing


class OrderCollectionCreate(BaseModel):
    """Collection purchase in order"""
    collection_id: int
    product_ids: List[int]  # Products in this collection purchase
    sale_price: float  # Collection's discounted price


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
    collections: Optional[List[OrderCollectionCreate]] = []  # Collections being purchased
    deposit_amount: Optional[float] = 0  # Số tiền cọc (nếu có)
    coupon_code: Optional[str] = None  # Mã giảm giá (nếu có)


class OrderUpdate(BaseModel):
    """Order update schema (admin)"""
    status: Optional[OrderStatus] = None
    cancellation_reason: Optional[str] = None
    is_paid: Optional[bool] = None
    shipping_fee: Optional[float] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    shipping_address: Optional[str] = None
    note: Optional[str] = None
    subtotal: Optional[float] = None
    discount_amount: Optional[float] = None
    payment_method: Optional[str] = None


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
