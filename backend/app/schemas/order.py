from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# Order Item Schemas
class OrderItemBase(BaseModel):
    listing_id: str
    variant_id: Optional[str] = None
    qty: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str
    seller_id: str
    title: str
    attrs: Optional[Dict[str, Any]] = None
    commission_rate: Decimal
    tax_rate: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    shipping_address_snapshot: Dict[str, Any]

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderResponse(OrderBase):
    id: str
    buyer_id: str
    status: str
    subtotal: Decimal
    shipping_fee: Decimal
    discount_total: Decimal
    tax_total: Decimal
    grand_total: Decimal
    currency: str
    escrow_state: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

# Return Schemas
class ReturnBase(BaseModel):
    reason: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None

class ReturnCreate(ReturnBase):
    order_item_id: str

class ReturnResponse(ReturnBase):
    id: str
    order_id: str
    order_item_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
