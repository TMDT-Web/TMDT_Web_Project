"""
Banner API Endpoints
"""
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.banner import (
    BannerResponse,
    BannerCreate,
    BannerUpdate,
    BannerListResponse
)
from app.services.banner_service import BannerService
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()


# Public endpoint
@router.get("/active", response_model=List[BannerResponse])
def get_active_banners(db: Session = Depends(get_db)):
    """Get all active banners for homepage display (public endpoint)"""
    banners = BannerService.get_active_banners(db)
    return banners


# Admin endpoints
@router.get("", response_model=BannerListResponse)
def get_banners(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all banners with pagination (admin only)"""
    banners, total = BannerService.get_banners(db, skip=skip, limit=limit)
    return BannerListResponse(banners=banners, total=total)


@router.get("/{banner_id}", response_model=BannerResponse)
def get_banner(
    banner_id: int = Path(..., gt=0),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get banner by ID (admin only)"""
    banner = BannerService.get_banner_by_id(db, banner_id)
    return banner


@router.post("", response_model=BannerResponse)
def create_banner(
    data: BannerCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new banner (admin only)"""
    banner = BannerService.create_banner(db, data)
    return banner


@router.put("/{banner_id}", response_model=BannerResponse)
def update_banner(
    banner_id: int = Path(..., gt=0),
    data: BannerUpdate = ...,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update banner (admin only)"""
    banner = BannerService.update_banner(db, banner_id, data)
    return banner


@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int = Path(..., gt=0),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete banner (admin only)"""
    BannerService.delete_banner(db, banner_id)
    return {"message": "Banner deleted successfully"}
