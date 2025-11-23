"""
Order Service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.loyalty_service import LoyaltyService


class OrderService:
    """Order service for managing orders with race condition prevention"""
    
    @staticmethod
    def create_order(db: Session, user_id: int, data: OrderCreate) -> Order:
        """Create new order with pessimistic locking to prevent race conditions"""
        # Validate input
        if not data.items or len(data.items) == 0:
            raise BadRequestException("Order must have at least one item")
        
        if data.deposit_amount and data.deposit_amount < 0:
            raise BadRequestException("Deposit cannot be negative")
        
        try:
            # Calculate order totals
            subtotal: float = 0
            order_items_data: List[dict] = []
        
            for item_data in data.items:
                # CRITICAL: Use pessimistic locking to prevent race conditions
                # Lock the product row until transaction completes
                product = db.query(Product)\
                    .filter(Product.id == item_data.product_id)\
                    .with_for_update()\
                    .first()
                
                if not product:
                    raise NotFoundException(f"Product {item_data.product_id} not found")
                
                if not product.is_active:
                    raise BadRequestException(f"Product {product.name} is no longer available")
                
                # CRITICAL: Validate stock AFTER acquiring lock to prevent race conditions
                if product.stock < item_data.quantity:
                    raise BadRequestException(
                        f"Insufficient stock for product {product.name}. "
                        f"Available: {product.stock}, Requested: {item_data.quantity}"
                    )
            
                # Use sale_price if available, otherwise use regular price
                actual_price: float = product.sale_price if product.sale_price else product.price
                item_subtotal: float = actual_price * item_data.quantity
                subtotal += item_subtotal
                
                # CRITICAL: Deduct stock immediately within transaction (with lock held)
                product.stock -= item_data.quantity
                
                order_items_data.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "price_at_purchase": actual_price,
                    "quantity": item_data.quantity,
                    "variant": item_data.variant
                })
            
            # Calculate shipping fee (can be dynamic based on location)
            shipping_fee: float = 50000.0  # 50k VND flat rate
            discount_amount: float = 0.0
            total_amount: float = subtotal + shipping_fee - discount_amount
            
            # Calculate deposit and remaining
            deposit_amount: float = data.deposit_amount if hasattr(data, 'deposit_amount') else 0.0
            
            # Validate deposit amount
            if deposit_amount > total_amount:
                raise BadRequestException(
                    f"Deposit ({deposit_amount}) cannot exceed total amount ({total_amount})"
                )
            
            remaining_amount: float = total_amount - deposit_amount
            is_paid: bool = (deposit_amount >= total_amount)
            
            # Create order
            order = Order(
                user_id=user_id,
                full_name=data.full_name,
                phone_number=data.phone_number,
                shipping_address=data.shipping_address,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                discount_amount=discount_amount,
                total_amount=total_amount,
                deposit_amount=deposit_amount,
                remaining_amount=remaining_amount,
                status=OrderStatus.PENDING if deposit_amount == 0 else OrderStatus.CONFIRMED,
                payment_method=data.payment_method,
                is_paid=is_paid,
                note=data.note
            )
            
            db.add(order)
            db.flush()  # Get order.id for order items
            
            # CRITICAL: Create order items atomically (stock already deducted above)
            # If this fails, transaction rolls back and stock is restored automatically
            for item_data in order_items_data:
                order_item = OrderItem(order_id=order.id, **item_data)
                db.add(order_item)
            
            db.commit()
            db.refresh(order)
            
            return order
            
        except (BadRequestException, NotFoundException):
            # Rollback transaction - stock deductions will be reverted
            db.rollback()
            raise
        except Exception as e:
            # Rollback transaction on any unexpected error
            db.rollback()
            raise BadRequestException(f"Failed to create order: {str(e)}")
    
    @staticmethod
    def get_orders(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[int] = None
    ) -> tuple[List[Order], int]:
        """Get orders"""
        query = db.query(Order)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        
        return orders, total
    
    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Order:
        """Get order by ID"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Order not found")
        return order
    
    @staticmethod
    def update_order(db: Session, order_id: int, data: OrderUpdate) -> Order:
        """Update order (admin) with stock restoration on cancellation"""
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise NotFoundException("Order not found")
            
            # Store old status for logic checks
            old_status: OrderStatus = order.status
            
            # Apply updates
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(order, field, value)
            
            # CRITICAL: Restore stock if order is cancelled or refunded
            # Use pessimistic locking to prevent race conditions
            if (old_status not in [OrderStatus.CANCELLED, OrderStatus.REFUNDED] and 
                order.status in [OrderStatus.CANCELLED, OrderStatus.REFUNDED]):
                for item in order.items:
                    # Lock product row to prevent concurrent modifications
                    product = db.query(Product)\
                        .filter(Product.id == item.product_id)\
                        .with_for_update()\
                        .first()
                    if product:
                        product.stock += item.quantity
            
            # CRITICAL: Award loyalty points when order is COMPLETED and PAID
            # This prevents awarding points for unpaid or incomplete orders
            if (old_status != OrderStatus.COMPLETED and 
                order.status == OrderStatus.COMPLETED and 
                order.is_paid):  # Check payment status before awarding points
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    LoyaltyService.add_points(db, user, order.total_amount)
            
            db.commit()
            db.refresh(order)
            return order
            
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update order: {str(e)}")
