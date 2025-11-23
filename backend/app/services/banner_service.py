"""
Banner Service - Business logic for banner management
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Tuple

from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate


class BannerService:
    """Service class for banner operations"""
    
    @staticmethod
    def get_banners(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Banner], int]:
        """
        Get all banners with pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (banners list, total count)
        """
        query = db.query(Banner).order_by(Banner.display_order.asc(), Banner.id.desc())
        total = query.count()
        banners = query.offset(skip).limit(limit).all()
        return banners, total
    
    @staticmethod
    def get_active_banners(db: Session) -> List[Banner]:
        """
        Get only active banners ordered by display_order (for public display)
        
        Args:
            db: Database session
            
        Returns:
            List of active banners
        """
        return db.query(Banner)\
            .filter(Banner.is_active == True)\
            .order_by(Banner.display_order.asc(), Banner.id.desc())\
            .all()
    
    @staticmethod
    def get_banner_by_id(db: Session, banner_id: int) -> Banner:
        """
        Get banner by ID
        
        Args:
            db: Database session
            banner_id: Banner ID
            
        Returns:
            Banner object
            
        Raises:
            HTTPException: If banner not found
        """
        banner = db.query(Banner).filter(Banner.id == banner_id).first()
        if not banner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Banner with id {banner_id} not found"
            )
        return banner
    
    @staticmethod
    def create_banner(db: Session, data: BannerCreate) -> Banner:
        """
        Create new banner
        
        Args:
            db: Database session
            data: Banner creation data
            
        Returns:
            Created banner
        """
        banner = Banner(**data.model_dump())
        db.add(banner)
        db.commit()
        db.refresh(banner)
        return banner
    
    @staticmethod
    def update_banner(db: Session, banner_id: int, data: BannerUpdate) -> Banner:
        """
        Update banner
        
        Args:
            db: Database session
            banner_id: Banner ID
            data: Banner update data
            
        Returns:
            Updated banner
            
        Raises:
            HTTPException: If banner not found
        """
        banner = BannerService.get_banner_by_id(db, banner_id)
        
        # Update only provided fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(banner, field, value)
        
        db.commit()
        db.refresh(banner)
        return banner
    
    @staticmethod
    def delete_banner(db: Session, banner_id: int) -> None:
        """
        Delete banner
        
        Args:
            db: Database session
            banner_id: Banner ID
            
        Raises:
            HTTPException: If banner not found
        """
        banner = BannerService.get_banner_by_id(db, banner_id)
        db.delete(banner)
        db.commit()
