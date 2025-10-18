from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.inventory.models import PurchaseOrderStatus
from app.schemas.base import OrmBaseModel


class SupplierCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    tax_code: Optional[str] = None
    notes: Optional[str] = None


class SupplierRead(OrmBaseModel):
    id: int
    name: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    address: Optional[str]
    tax_code: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: Decimal


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: List[PurchaseOrderItemCreate]
    notes: Optional[str] = None


class PurchaseOrderItemRead(OrmBaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: Decimal
    subtotal: Decimal


class PurchaseOrderRead(OrmBaseModel):
    id: int
    supplier_id: int
    reference_code: str
    status: PurchaseOrderStatus
    total_cost: Decimal
    received_at: Optional[datetime]
    created_at: datetime
    notes: Optional[str]
    items: List[PurchaseOrderItemRead]
