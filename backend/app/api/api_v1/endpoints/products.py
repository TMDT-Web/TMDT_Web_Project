"""
Product Endpoints
"""
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.product import (
    ProductResponse, ProductCreate, ProductUpdate, ProductListResponse,
    CategoryResponse, CategoryCreate, CategoryUpdate
)
from app.services.product_service import ProductService
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()


# Public endpoints
@router.get("", response_model=ProductListResponse)
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = Query(None),
    collection_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    db: Session = Depends(get_db)
):
    """Get all products with filters"""
    products, total = ProductService.get_products(
        db, skip=skip, limit=limit,
        category_id=category_id,
        collection_id=collection_id,
        search=search,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price
    )
    
    return ProductListResponse(products=products, total=total)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get product by ID"""
    product = ProductService.get_product_by_id(db, product_id)
    return product


@router.get("/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get product by slug"""
    product = ProductService.get_product_by_slug(db, slug)
    return product


# Admin endpoints
@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new product (admin only)"""
    product = ProductService.create_product(db, data)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update product (admin only)"""
    product = ProductService.update_product(db, product_id, data)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete product (admin only)"""
    ProductService.delete_product(db, product_id)
    return {"message": "Product deleted successfully"}


# Category endpoints
@router.get("/categories/", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    categories = ProductService.get_categories(db)
    return categories


@router.post("/categories/", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new category (admin only)"""
    category = ProductService.create_category(db, data)
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int = Path(..., gt=0),
    data: CategoryUpdate = ...,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update category (admin only)"""
    category = ProductService.update_category(db, category_id, data)
    return category


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int = Path(..., gt=0),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete category (admin only)"""
    ProductService.delete_category(db, category_id)
    return {"message": "Category deleted successfully"}
