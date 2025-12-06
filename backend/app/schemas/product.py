"""
Product Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.schemas.base import TimestampSchema


class CategoryBase(BaseModel):
    """Category base schema"""
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    """Category create schema"""
    pass


class CategoryUpdate(BaseModel):
    """Category update schema"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryResponse(CategoryBase):
    """Category response schema"""
    id: int

    class Config:
        from_attributes = True


# ============================================================================
# COLLECTION SCHEMAS (Bundle/Combo Support)
# ============================================================================

class CollectionItemBase(BaseModel):
    """Collection item base schema"""
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CollectionItemCreate(CollectionItemBase):
    """Collection item create schema"""
    pass


class CollectionItemResponse(CollectionItemBase):
    """Collection item response with product details"""
    id: int
    product: Optional['ProductResponse'] = None

    class Config:
        from_attributes = True


class CollectionBase(BaseModel):
    """Collection base schema"""
    name: str
    slug: str
    banner_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    sale_price: Optional[float] = None  # Giá ưu đãi khi mua cả bộ


class CollectionCreate(CollectionBase):
    """Collection create schema with bundle items"""
    items: List[CollectionItemCreate] = []
    sale_price: Optional[float] = Field(None, gt=0)


class CollectionUpdate(BaseModel):
    """Collection update schema"""
    name: Optional[str] = None
    slug: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sale_price: Optional[float] = None
    product_ids: Optional[List[int]] = None


class CollectionResponse(CollectionBase):
    """Collection response schema"""
    id: int
    sale_price: Optional[float] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Product base schema"""
    name: str
    slug: str
    sku: Optional[str] = None
    
    price: float = Field(..., gt=0)
    sale_price: Optional[float] = None
    stock: int = Field(default=0, ge=0)
    
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    images: List[str] = []
    
    dimensions: Optional[Dict[str, Any]] = None
    specs: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    
    category_id: int
    collection_id: Optional[int] = None
    
    is_active: bool = True
    is_featured: bool = False


class ProductCreate(ProductBase):
    """Product create schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = None
    slug: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    stock: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    images: Optional[List[str]] = None
    dimensions: Optional[Dict[str, Any]] = None
    specs: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    category_id: Optional[int] = None
    collection_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(TimestampSchema, ProductBase):
    """Product response schema"""
    category: Optional[CategoryResponse] = None
    collection: Optional[CollectionResponse] = None


class ProductListResponse(BaseModel):
    """Product list response"""
    products: List[ProductResponse]
    total: int


class CollectionWithProductsResponse(CollectionBase):
    """Collection response with bundle items and pricing details"""
    id: int
    sale_price: Optional[float] = None
    total_original_price: float = 0.0
    discount_amount: float = 0.0
    discount_percentage: float = 0.0
    items: List[CollectionItemResponse] = []
    products: List[ProductResponse] = []  # Backward compatibility

    class Config:
        from_attributes = True


class CollectionListResponse(BaseModel):
    """Collection list response"""
    collections: List[CollectionResponse]
    total: int
