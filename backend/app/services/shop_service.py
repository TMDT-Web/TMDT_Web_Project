from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.identity import User
from app.models.shop import Shop, PayoutAccount
from app.schemas.shop import ShopCreate, ShopUpdate, ShopResponse, PayoutAccountCreate, PayoutAccountResponse
from typing import List

class ShopService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_shop(self, shop_data: ShopCreate, owner_user_id: str) -> ShopResponse:
        # Check if user already has a shop
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == owner_user_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a shop"
            )

        # Check if slug is already taken
        result = await self.db.execute(
            select(Shop).where(Shop.slug == shop_data.slug)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shop slug already exists"
            )

        # Create shop
        shop = Shop(
            owner_user_id=owner_user_id,
            display_name=shop_data.display_name,
            slug=shop_data.slug,
            logo_url=shop_data.logo_url,
            policies=shop_data.policies,
            status="active"
        )
        
        self.db.add(shop)
        await self.db.commit()
        await self.db.refresh(shop)
        
        return ShopResponse.model_validate(shop)

    async def get_user_shop(self, user_id: str) -> ShopResponse:
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == user_id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )
        
        return ShopResponse.model_validate(shop)

    async def update_shop(self, user_id: str, shop_data: ShopUpdate) -> ShopResponse:
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == user_id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )

        # Update fields
        update_data = shop_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(shop, field, value)
        
        await self.db.commit()
        await self.db.refresh(shop)
        
        return ShopResponse.model_validate(shop)

    async def get_shop(self, shop_id: str) -> ShopResponse:
        result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )
        
        return ShopResponse.model_validate(shop)

    async def add_payout_account(self, user_id: str, payout_data: PayoutAccountCreate) -> PayoutAccountResponse:
        # Get user's shop
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == user_id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )

        # Create payout account
        payout_account = PayoutAccount(
            shop_id=shop.id,
            bank=payout_data.bank,
            account_no_masked=payout_data.account_no_masked,
            owner_name=payout_data.owner_name
        )
        
        self.db.add(payout_account)
        await self.db.commit()
        await self.db.refresh(payout_account)
        
        return PayoutAccountResponse.model_validate(payout_account)

    async def get_payout_accounts(self, user_id: str) -> List[PayoutAccountResponse]:
        # Get user's shop
        result = await self.db.execute(
            select(Shop).where(Shop.owner_user_id == user_id)
        )
        shop = result.scalar_one_or_none()
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )

        # Get payout accounts
        result = await self.db.execute(
            select(PayoutAccount).where(PayoutAccount.shop_id == shop.id)
        )
        payout_accounts = result.scalars().all()
        
        return [PayoutAccountResponse.model_validate(account) for account in payout_accounts]
