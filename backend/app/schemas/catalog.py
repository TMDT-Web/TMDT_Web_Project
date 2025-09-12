from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    parent_id: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    parent_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Listing Schemas
class ListingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    condition: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=128)
    price: Decimal = Field(..., ge=0)
    currency: str = Field("VND", max_length=3)
    stock: int = Field(0, ge=0)
    sku: Optional[str] = Field(None, max_length=128)

class ListingCreate(ListingBase):
    category_id: Optional[str] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    condition: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=128)
    price: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    stock: Optional[int] = Field(None, ge=0)
    sku: Optional[str] = Field(None, max_length=128)
    status: Optional[str] = None

class ListingResponse(ListingBase):
    id: str
    shop_id: str
    category_id: Optional[str]
    status: str
    moderation_status: str
    seo_slug: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Media Schemas
class MediaBase(BaseModel):
    url: str = Field(..., min_length=1, max_length=1024)
    mime: Optional[str] = Field(None, max_length=128)
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    content_hash: Optional[str] = Field(None, max_length=128)
    sort_order: int = 0

class MediaCreate(MediaBase):
    pass

class MediaResponse(MediaBase):
    id: str
    listing_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Variant Schemas
class VariantBase(BaseModel):
    variant_sku: Optional[str] = Field(None, max_length=128)
    attrs: Optional[Dict[str, Any]] = None
    price: Optional[Decimal] = Field(None, ge=0)
    stock: int = Field(0, ge=0)

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    id: str
    listing_id: str
    created_at: datetime

    class Config:
        from_attributes = True
