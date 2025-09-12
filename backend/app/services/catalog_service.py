from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status
from app.models.identity import User
from app.models.shop import Shop
from app.models.catalog import Category, Listing, Media
from app.schemas.catalog import (
    CategoryCreate, CategoryResponse,
    ListingCreate, ListingUpdate, ListingResponse,
    MediaCreate, MediaResponse
)
from typing import List, Optional

class CatalogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Category methods
    async def get_categories(self, parent_id: Optional[str] = None) -> List[CategoryResponse]:
        query = select(Category)
        if parent_id:
            query = query.where(Category.parent_id == parent_id)
        else:
            query = query.where(Category.parent_id.is_(None))
        
        result = await self.db.execute(query)
        categories = result.scalars().all()
        
        return [CategoryResponse.model_validate(category) for category in categories]

    async def create_category(self, category_data: CategoryCreate, user: User) -> CategoryResponse:
        if not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Check if slug already exists
        result = await self.db.execute(
            select(Category).where(Category.slug == category_data.slug)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category slug already exists"
            )

        category = Category(
            parent_id=category_data.parent_id,
            name=category_data.name,
            slug=category_data.slug,
            sort_order=category_data.sort_order
        )
        
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        
        return CategoryResponse.model_validate(category)

    # Listing methods
    async def get_listings(
        self,
        category_id: Optional[str] = None,
        shop_id: Optional[str] = None,
        status: str = "active",
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[ListingResponse]:
        query = select(Listing)
        
        # Apply filters
        if category_id:
            query = query.where(Listing.category_id == category_id)
        if shop_id:
            query = query.where(Listing.shop_id == shop_id)
        if status:
            query = query.where(Listing.status == status)
        
        # Apply search
        if search:
            query = query.where(
                or_(
                    Listing.title.contains(search),
                    Listing.description.contains(search)
                )
            )
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        listings = result.scalars().all()
        
        return [ListingResponse.model_validate(listing) for listing in listings]

    async def get_listing(self, listing_id: str) -> ListingResponse:
        result = await self.db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
        
        return ListingResponse.model_validate(listing)

    async def create_listing(self, listing_data: ListingCreate, user: User) -> ListingResponse:
        # Get user's shop
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == user.id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found. Please create a shop first."
            )

        # Check if SKU already exists
        if listing_data.sku:
            result = await self.db.execute(
                select(Listing).where(Listing.sku == listing_data.sku)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SKU already exists"
                )

        listing = Listing(
            shop_id=shop.id,
            category_id=listing_data.category_id,
            title=listing_data.title,
            description=listing_data.description,
            condition=listing_data.condition,
            brand=listing_data.brand,
            price=listing_data.price,
            currency=listing_data.currency,
            stock=listing_data.stock,
            sku=listing_data.sku,
            status="draft",
            moderation_status="pending"
        )
        
        self.db.add(listing)
        await self.db.commit()
        await self.db.refresh(listing)
        
        return ListingResponse.model_validate(listing)

    async def update_listing(self, listing_id: str, listing_data: ListingUpdate, user: User) -> ListingResponse:
        # Get listing
        result = await self.db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )

        # Check if user owns the shop
        result = await self.db.execute(
            select(Shop).where(and_(Shop.id == listing.shop_id, Shop.owner_user_id == user.id))
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # Update fields
        update_data = listing_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(listing, field, value)
        
        await self.db.commit()
        await self.db.refresh(listing)
        
        return ListingResponse.model_validate(listing)

    async def delete_listing(self, listing_id: str, user: User) -> None:
        # Get listing
        result = await self.db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )

        # Check if user owns the shop
        result = await self.db.execute(
            select(Shop).where(and_(Shop.id == listing.shop_id, Shop.owner_user_id == user.id))
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        await self.db.delete(listing)
        await self.db.commit()

    # Media methods
    async def add_media(self, listing_id: str, media_data: MediaCreate, user: User) -> MediaResponse:
        # Get listing and check ownership
        result = await self.db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )

        result = await self.db.execute(
            select(Shop).where(and_(Shop.id == listing.shop_id, Shop.owner_user_id == user.id))
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        media = Media(
            listing_id=listing_id,
            url=media_data.url,
            mime=media_data.mime,
            width=media_data.width,
            height=media_data.height,
            size_bytes=media_data.size_bytes,
            content_hash=media_data.content_hash,
            sort_order=media_data.sort_order
        )
        
        self.db.add(media)
        await self.db.commit()
        await self.db.refresh(media)
        
        return MediaResponse.model_validate(media)

    async def delete_media(self, listing_id: str, media_id: str, user: User) -> None:
        # Get media and check ownership
        result = await self.db.execute(
            select(Media).join(Listing).join(Shop).where(
                and_(
                    Media.id == media_id,
                    Media.listing_id == listing_id,
                    Shop.owner_user_id == user.id
                )
            )
        )
        media = result.scalar_one_or_none()
        
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media not found"
            )

        await self.db.delete(media)
        await self.db.commit()
