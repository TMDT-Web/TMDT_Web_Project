"""
Collection Endpoints
"""
from fastapi import APIRouter, Depends, Query, Path, Body
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.schemas.product import (
    CollectionResponse,
    CollectionCreate,
    CollectionUpdate,
    CollectionWithProductsResponse,
    CollectionListResponse
)
from app.services.collection_service import CollectionService
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()


# Public endpoints
@router.get("", response_model=CollectionListResponse)
def get_collections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all collections"""
    collections, total = CollectionService.get_collections(
        db, skip=skip, limit=limit, is_active=is_active
    )
    return CollectionListResponse(collections=collections, total=total)


@router.get("/{collection_id}", response_model=CollectionWithProductsResponse)
def get_collection(
    collection_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get collection by ID with products"""
    collection = CollectionService.get_collection_by_id(db, collection_id)
    return collection


@router.get("/slug/{slug}", response_model=CollectionWithProductsResponse)
def get_collection_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get collection by slug with products"""
    collection = CollectionService.get_collection_by_slug(db, slug)
    return collection


# Admin endpoints
@router.post("", response_model=CollectionResponse)
def create_collection(
    data: CollectionCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create new collection/bundle (admin only)
    
    Provide 'items' array with product_id and quantity for bundle items.
    Set 'sale_price' for the special combo price.
    """
    collection = CollectionService.create_collection(db, data)
    return collection


@router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int = Path(..., gt=0),
    data: CollectionUpdate = ...,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update collection/bundle (admin only)
    
    Update 'items' to change bundle contents with quantities.
    Update 'sale_price' to change the combo price.
    """
    collection = CollectionService.update_collection(db, collection_id, data)
    return collection


@router.delete("/{collection_id}")
def delete_collection(
    collection_id: int = Path(..., gt=0),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete collection (admin only)"""
    CollectionService.delete_collection(db, collection_id)
    return {"message": "Collection deleted successfully"}


@router.post("/{collection_id}/products", response_model=CollectionResponse)
def add_products_to_collection(
    collection_id: int = Path(..., gt=0),
    product_ids: List[int] = Body(..., embed=True),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Add products to collection (admin only)
    
    This adds products without removing existing ones.
    """
    collection = CollectionService.add_products_to_collection(db, collection_id, product_ids)
    return collection


@router.delete("/{collection_id}/products", response_model=CollectionResponse)
def remove_products_from_collection(
    collection_id: int = Path(..., gt=0),
    product_ids: List[int] = Body(..., embed=True),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Remove products from collection (admin only)
    """
    collection = CollectionService.remove_products_from_collection(db, collection_id, product_ids)
    return collection
