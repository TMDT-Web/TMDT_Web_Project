"""
Dashboard Service
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User


class DashboardService:
    """Dashboard statistics service"""
    
    @staticmethod
    def get_stats(db: Session) -> dict:
        """
        Get admin dashboard statistics
        
        Returns:
            dict: Dashboard statistics including:
                - total_revenue: Total revenue from non-cancelled orders
                - total_orders: Count of all orders
                - pending_orders: Count of pending orders
                - low_stock_products: Count of products with stock < 5
                - total_users: Count of all users
                - active_products: Count of active products
        """
        # 1. Total Revenue (exclude cancelled and refunded orders)
        revenue_result = db.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.status != OrderStatus.CANCELLED,
                Order.status != OrderStatus.REFUNDED
            )
        ).scalar()
        total_revenue = float(revenue_result) if revenue_result else 0.0
        
        # 2. Total Orders
        total_orders = db.query(func.count(Order.id)).scalar()
        
        # 3. Pending Orders (PENDING or AWAITING_PAYMENT)
        pending_orders = db.query(func.count(Order.id)).filter(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT])
        ).scalar()
        
        # 4. Low Stock Products (stock < 5 and is_active = true)
        low_stock_products = db.query(func.count(Product.id)).filter(
            and_(
                Product.stock < 5,
                Product.is_active == True
            )
        ).scalar()
        
        # 5. Total Users
        total_users = db.query(func.count(User.id)).scalar()
        
        # 6. Active Products
        active_products = db.query(func.count(Product.id)).filter(
            Product.is_active == True
        ).scalar()
        
        # 7. Completed Orders (for success rate)
        completed_orders = db.query(func.count(Order.id)).filter(
            Order.status == OrderStatus.COMPLETED
        ).scalar()
        
        # 8. Cancelled Orders
        cancelled_orders = db.query(func.count(Order.id)).filter(
            Order.status == OrderStatus.CANCELLED
        ).scalar()
        
        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders or 0,
            "pending_orders": pending_orders or 0,
            "low_stock_products": low_stock_products or 0,
            "total_users": total_users or 0,
            "active_products": active_products or 0,
            "completed_orders": completed_orders or 0,
            "cancelled_orders": cancelled_orders or 0
        }
    
    @staticmethod
    def get_recent_orders(db: Session, limit: int = 10) -> list:
        """Get recent orders"""
        orders = db.query(Order).order_by(Order.created_at.desc()).limit(limit).all()
        return orders
    
    @staticmethod
    def get_top_products(db: Session, limit: int = 10) -> list:
        """Get top selling products by quantity"""
        from app.models.order import OrderItem
        
        results = db.query(
            Product.id,
            Product.name,
            Product.thumbnail_url,
            Product.price,
            func.sum(OrderItem.quantity).label('total_sold')
        ).join(
            OrderItem, OrderItem.product_id == Product.id
        ).join(
            Order, Order.id == OrderItem.order_id
        ).filter(
            Order.status != OrderStatus.CANCELLED
        ).group_by(
            Product.id,
            Product.name,
            Product.thumbnail_url,
            Product.price
        ).order_by(
            func.sum(OrderItem.quantity).desc()
        ).limit(limit).all()
        
        return [
            {
                "id": r.id,
                "name": r.name,
                "thumbnail_url": r.thumbnail_url,
                "price": r.price,
                "total_sold": r.total_sold
            }
            for r in results
        ]
