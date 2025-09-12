from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.schemas.shop import ShopCreate, ShopUpdate, ShopResponse, PayoutAccountCreate, PayoutAccountResponse
from app.services.shop_service import ShopService
from app.api.dependencies import get_current_user
from app.models.identity import User

router = APIRouter(prefix="/shops", tags=["Shops"])

@router.post("/", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
async def create_shop(
    shop_data: ShopCreate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new shop"""
    shop_service = ShopService(db)
    return await shop_service.create_shop(shop_data, current_user.id)

@router.get("/me", response_model=ShopResponse)
async def get_my_shop(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Get current user's shop"""
    shop_service = ShopService(db)
    return await shop_service.get_user_shop(current_user.id)

@router.put("/me", response_model=ShopResponse)
async def update_my_shop(
    shop_data: ShopUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Update current user's shop"""
    shop_service = ShopService(db)
    return await shop_service.update_shop(current_user.id, shop_data)

@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: str, db: AsyncSession = Depends(async_session)):
    """Get shop by ID"""
    shop_service = ShopService(db)
    return await shop_service.get_shop(shop_id)

@router.post("/me/payout-accounts", response_model=PayoutAccountResponse, status_code=status.HTTP_201_CREATED)
async def add_payout_account(
    payout_data: PayoutAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Add payout account to current user's shop"""
    shop_service = ShopService(db)
    return await shop_service.add_payout_account(current_user.id, payout_data)

@router.get("/me/payout-accounts", response_model=list[PayoutAccountResponse])
async def get_payout_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Get current user's shop payout accounts"""
    shop_service = ShopService(db)
    return await shop_service.get_payout_accounts(current_user.id)
