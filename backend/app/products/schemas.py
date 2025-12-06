from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import Field

from app.schemas.base import OrmBaseModel


class CategoryBase(OrmBaseModel):
    name: str = Field(max_length=100)
    slug: str = Field(max_length=120)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int
    created_at: datetime


class TagBase(OrmBaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int


class ProductImageRead(OrmBaseModel):
    id: int
    file_path: str
    alt_text: Optional[str] = None
    is_primary: bool
    created_at: datetime


class ProductBase(OrmBaseModel):
    sku: str = Field(max_length=50)
    name: str = Field(max_length=255)
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    specifications: Optional[dict] = None
    main_image: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: List[int] = []


class ProductCreate(ProductBase):
    pass


class ProductUpdate(OrmBaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    specifications: Optional[dict] = None
    main_image: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None


class ProductRead(ProductBase):
    id: int
    is_active: bool
    category: Optional[CategoryRead] = None
    tags: List[TagRead] = []
    images: List[ProductImageRead] = []
    created_at: datetime
    updated_at: datetime


class ProductListItem(OrmBaseModel):
    id: int
    name: str
    price: Decimal
    main_image: Optional[str] = None
    stock_quantity: int
    is_active: bool


class ProductListResponse(OrmBaseModel):
    items: List[ProductListItem]
    total: int
    page: int
    size: int


class ProductSearchQuery(OrmBaseModel):
    q: Optional[str] = None
    category_id: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    tag_ids: Optional[List[int]] = None
    page: int = 1
    size: int = 20


class SuggestionResponse(OrmBaseModel):
    suggestions: List[str]
