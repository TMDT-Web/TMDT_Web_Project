from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.session import async_session
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from app.services.order_service import OrderService
from app.api.dependencies import get_current_user
from app.models.identity import User

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Create a new order"""
    order_service = OrderService(db)
    return await order_service.create_order(order_data, current_user)

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Get user's orders"""
    order_service = OrderService(db)
    return await order_service.get_user_orders(current_user.id, status, page, limit)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Get order by ID"""
    order_service = OrderService(db)
    return await order_service.get_order(order_id, current_user)

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Update order status"""
    order_service = OrderService(db)
    return await order_service.update_order_status(order_id, status, current_user)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Cancel order"""
    order_service = OrderService(db)
    return await order_service.cancel_order(order_id, current_user)

# Seller endpoints
@router.get("/seller/orders", response_model=List[OrderResponse])
async def get_seller_orders(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Get orders for seller's shop"""
    order_service = OrderService(db)
    return await order_service.get_seller_orders(current_user.id, status, page, limit)

@router.put("/{order_id}/pack", response_model=OrderResponse)
async def pack_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Mark order as packed"""
    order_service = OrderService(db)
    return await order_service.pack_order(order_id, current_user)

@router.put("/{order_id}/ship", response_model=OrderResponse)
async def ship_order(
    order_id: str,
    tracking_no: str,
    carrier: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(async_session)
):
    """Mark order as shipped"""
    order_service = OrderService(db)
    return await order_service.ship_order(order_id, tracking_no, carrier, current_user)
