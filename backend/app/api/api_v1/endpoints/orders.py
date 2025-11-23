"""
Order Endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.order import OrderResponse, OrderCreate, OrderUpdate, OrderListResponse
from app.services.order_service import OrderService
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new order"""
    order = OrderService.create_order(db, current_user.id, data)
    return order


@router.get("/my-orders", response_model=OrderListResponse)
def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's orders"""
    orders, total = OrderService.get_orders(db, skip=skip, limit=limit, user_id=current_user.id)
    return OrderListResponse(orders=orders, total=total)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order by ID"""
    order = OrderService.get_order_by_id(db, order_id)
    
    # Check authorization
    if order.user_id != current_user.id and not current_user.is_admin:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Access denied")
    
    return order


# Admin endpoints
@router.get("", response_model=OrderListResponse)
def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders (admin only)"""
    orders, total = OrderService.get_orders(db, skip=skip, limit=limit)
    return OrderListResponse(orders=orders, total=total)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update order status (admin only)"""
    order = OrderService.update_order(db, order_id, data)
    return order
