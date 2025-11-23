"""
Dashboard Endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.dashboard_service import DashboardService
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics (admin only)
    
    Returns:
        - total_revenue: Sum of total_amount where status != cancelled/refunded
        - total_orders: Count of all orders
        - pending_orders: Count of orders with status='pending' or 'awaiting_payment'
        - low_stock_products: Count of products with stock < 5 and is_active=true
        - total_users: Count of all users
        - active_products: Count of active products
        - completed_orders: Count of completed orders
        - cancelled_orders: Count of cancelled orders
    """
    stats = DashboardService.get_stats(db)
    return stats


@router.get("/recent-orders")
def get_recent_orders(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get recent orders (admin only)"""
    orders = DashboardService.get_recent_orders(db, limit)
    return orders


@router.get("/top-products")
def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get top selling products (admin only)"""
    products = DashboardService.get_top_products(db, limit)
    return products
