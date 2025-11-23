"""
Cart Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.schemas.base import TimestampSchema


class CartItemBase(BaseModel):
    """Cart item base schema"""
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemCreate(CartItemBase):
    """Cart item create schema"""
    pass


class CartItemUpdate(BaseModel):
    """Cart item update schema"""
    quantity: int = Field(..., ge=1)


class CartItemProductInfo(BaseModel):
    """Minimal product info for cart item"""
    id: int
    name: str
    slug: str
    price: float
    sale_price: Optional[float] = None
    thumbnail_url: Optional[str] = None
    stock: int
    is_active: bool
    
    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    """Cart item response schema"""
    id: int
    cart_id: int
    product_id: int
    quantity: int
    product: CartItemProductInfo
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Cart response schema"""
    id: int
    user_id: int
    items: List[CartItemResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CartSummary(BaseModel):
    """Cart summary with calculated totals"""
    cart: CartResponse
    subtotal: float
    total_items: int
    
    class Config:
        from_attributes = True
