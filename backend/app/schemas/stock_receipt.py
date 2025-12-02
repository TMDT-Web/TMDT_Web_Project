"""
Stock Receipt Schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class StockReceiptItemCreate(BaseModel):
    """Schema for creating stock receipt item"""
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    notes: Optional[str] = None


class StockReceiptItemResponse(BaseModel):
    """Schema for stock receipt item response"""
    id: int
    receipt_id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StockReceiptCreate(BaseModel):
    """Schema for creating stock receipt"""
    supplier_name: str = Field(min_length=1, max_length=255)
    supplier_phone: Optional[str] = Field(None, max_length=20)
    supplier_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[StockReceiptItemCreate] = Field(min_items=1)


class StockReceiptUpdate(BaseModel):
    """Schema for updating stock receipt"""
    supplier_name: Optional[str] = Field(None, min_length=1, max_length=255)
    supplier_phone: Optional[str] = Field(None, max_length=20)
    supplier_address: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[StockReceiptItemCreate]] = None


class StockReceiptResponse(BaseModel):
    """Schema for stock receipt response"""
    id: int
    receipt_code: str
    supplier_name: str
    supplier_phone: Optional[str] = None
    supplier_address: Optional[str] = None
    total_amount: Decimal
    notes: Optional[str] = None
    status: str
    created_by: int
    creator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    items: List[StockReceiptItemResponse] = []

    class Config:
        from_attributes = True


class StockReceiptListResponse(BaseModel):
    """Schema for paginated stock receipt list"""
    receipts: List[StockReceiptResponse]
    total: int
    page: int
    size: int
    pages: int
