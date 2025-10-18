from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.schemas.base import OrmBaseModel


class CartItemCreate(OrmBaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(OrmBaseModel):
    quantity: int


class CartItemRead(OrmBaseModel):
    id: int
    product_id: int
    quantity: int
    created_at: datetime
    updated_at: datetime
