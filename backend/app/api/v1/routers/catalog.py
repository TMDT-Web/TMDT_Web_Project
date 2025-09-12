from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.session import async_session
from app.schemas.catalog import (
    CategoryCreate, CategoryResponse, 
    ListingCreate, ListingUpdate, ListingResponse,
    MediaCreate, MediaResponse
)
from app.services.catalog_service import CatalogService
from app.api.dependencies import get_current_user
from app.models.identity import User

router = APIRouter(prefix="/catalog", tags=["Catalog"])

# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    parent_id: Optional[str] = Query(None, description="Filter by parent category ID"),
    db: AsyncSession = Depends(async_session)
):
    """Get all categories"""
    catalog_service = CatalogService(db)
    return await catalog_service.get_categories(parent_id)

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new category (admin only)"""
    catalog_service = CatalogService(db)
    return await catalog_service.create_category(category_data, current_user)

# Listings
@router.get("/listings", response_model=List[ListingResponse])
async def get_listings(
    category_id: Optional[str] = Query(None),
    shop_id: Optional[str] = Query(None),
    status: Optional[str] = Query("active"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(async_session)
):
    """Get listings with filters"""
    catalog_service = CatalogService(db)
    return await catalog_service.get_listings(
        category_id=category_id,
        shop_id=shop_id,
        status=status,
        search=search,
        page=page,
        limit=limit
    )

@router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: str, db: AsyncSession = Depends(async_session)):
    """Get listing by ID"""
    catalog_service = CatalogService(db)
    return await catalog_service.get_listing(listing_id)

@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new listing"""
    catalog_service = CatalogService(db)
    return await catalog_service.create_listing(listing_data, current_user)

@router.put("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    listing_data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Update listing"""
    catalog_service = CatalogService(db)
    return await catalog_service.update_listing(listing_id, listing_data, current_user)

@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Delete listing"""
    catalog_service = CatalogService(db)
    await catalog_service.delete_listing(listing_id, current_user)

# Media
@router.post("/listings/{listing_id}/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def add_media(
    listing_id: str,
    media_data: MediaCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Add media to listing"""
    catalog_service = CatalogService(db)
    return await catalog_service.add_media(listing_id, media_data, current_user)

@router.delete("/listings/{listing_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    listing_id: str,
    media_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Delete media from listing"""
    catalog_service = CatalogService(db)
    await catalog_service.delete_media(listing_id, media_id, current_user)
