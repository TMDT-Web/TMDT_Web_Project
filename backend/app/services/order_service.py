"""
Order Service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product
from app.models.collection import Collection
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.loyalty_service import LoyaltyService


class OrderService:
    """Order service for managing orders with race condition prevention"""
    
    @staticmethod
    def _expand_cart_items_from_collections(db: Session, user_id: int, order_items: List) -> List:
        """
        Expand cart items: if any item is explicitly marked as a collection (is_collection=True),
        replace it with actual products from that collection.
        
        This prevents ID collision between Products and Collections by checking the explicit flag.
        
        Returns: List of expanded OrderItemCreate objects with real product_ids and price_override
        """
        from app.schemas.order import OrderItemCreate
        
        expanded_items = []
        
        for order_item_data in order_items:
            # CRITICAL: Check explicit is_collection flag to prevent ID collision
            # Without this, Product ID 1 would be mistaken for Collection ID 1
            if hasattr(order_item_data, 'is_collection') and order_item_data.is_collection:
                # This is explicitly a collection - query Collection table
                collection = db.query(Collection).filter(Collection.id == order_item_data.product_id).first()
                
                if collection and collection.items:
                    # This is a collection - expand it into actual products
                    # BUT preserve the bundle price by distributing it proportionally
                    
                    # Calculate total original price of all products in collection
                    total_original_price = sum(
                        (item.product.sale_price or item.product.price) * item.quantity 
                        for item in collection.items if item.product
                    )
                    
                    # Bundle price from collection (sale_price)
                    bundle_price = collection.sale_price * order_item_data.quantity
                    
                    # Calculate price ratio to distribute bundle discount
                    price_ratio = bundle_price / total_original_price if total_original_price > 0 else 1.0
                    
                    for coll_item in collection.items:
                        if coll_item.product:  # Ensure product exists
                            # Calculate this product's share of the bundle price
                            original_price = coll_item.product.sale_price or coll_item.product.price
                            adjusted_price = original_price * price_ratio
                            
                            # Create order item with price override
                            expanded_items.append(OrderItemCreate(
                                product_id=coll_item.product_id,
                                quantity=coll_item.quantity * order_item_data.quantity,
                                variant=None,
                                price_override=adjusted_price,
                                is_collection=False  # These are now regular products
                            ))
                else:
                    # Collection not found - keep the item (will fail with proper error later)
                    expanded_items.append(order_item_data)
            else:
                # NOT a collection - treat as regular product
                # Skip Collection lookup entirely to avoid ID collision
                product = db.query(Product).filter(Product.id == order_item_data.product_id).first()
                if product:
                    expanded_items.append(order_item_data)
                else:
                    # Product not found - keep it (will fail with proper error later)
                    expanded_items.append(order_item_data)
        
        return expanded_items
    
    @staticmethod
    def create_order(db: Session, user_id: int, data: OrderCreate) -> Order:
        """Create new order with pessimistic locking to prevent race conditions"""
        # Validate input
        if not data.items or len(data.items) == 0:
            raise BadRequestException("Order must have at least one item")
        
        if data.deposit_amount and data.deposit_amount < 0:
            raise BadRequestException("Deposit cannot be negative")
        
        try:
            import logging
            logger = logging.getLogger("order_debug")
            logger.setLevel(logging.INFO)
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
            if not logger.hasHandlers():
                logger.addHandler(handler)

            # 1. Expand any collections into constituent products with DISCOUNTED prices
            expanded_items = OrderService._expand_cart_items_from_collections(db, user_id, data.items)
            
            # Calculate order totals and validate stock
            subtotal: float = 0
            order_items_data: List[dict] = []
        
            # 2. Process the expanded items (which are now all real products)
            for item_data in expanded_items:
                product_id = item_data.product_id
                quantity = item_data.quantity
                
                # Get product with pessimistic lock
                product = db.query(Product)\
                    .filter(Product.id == product_id)\
                    .with_for_update()\
                    .first()
                
                if not product:
                    raise NotFoundException(f"Product {product_id} not found")
                
                if not product.is_active:
                    raise BadRequestException(f"Product {product.name} is no longer available")
                
                # Validate stock
                if product.stock < quantity:
                    raise BadRequestException(
                        f"Insufficient stock for product {product.name}. "
                        f"Available: {product.stock}, Requested: {quantity}"
                    )
                
                # Use price_override if available (from collection discount), otherwise use sale_price or regular price
                if hasattr(item_data, 'price_override') and item_data.price_override is not None:
                    actual_price = item_data.price_override
                else:
                    actual_price = product.sale_price if product.sale_price else product.price
                
                item_subtotal = actual_price * quantity
                subtotal += item_subtotal
                logger.info(f"[ORDER] Product: {product.name} | ProductID: {product.id} | Qty: {quantity} | Price: {actual_price}")
                logger.info(f"[ORDER]   - Add subtotal: {item_subtotal} | Running subtotal: {subtotal}")
                
                # Deduct stock
                product.stock -= quantity
                logger.info(f"[ORDER]   - Deduct stock: {product.name} | ProductID: {product.id} | Deduct: {quantity} | Remain: {product.stock}")
                
                order_items_data.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "price_at_purchase": actual_price,
                    "quantity": quantity,
                    "variant": item_data.variant
                })
                logger.info(f"[ORDER]   - Add order item: {product.name} | ProductID: {product.id} | Qty: {quantity} | Price: {actual_price}")
            
            # Calculate shipping fee (can be dynamic based on location)
            shipping_fee: float = 50000.0  # 50k VND flat rate
            discount_amount: float = 0.0
            total_amount: float = subtotal + shipping_fee - discount_amount
            logger.info(f"[ORDER] FINAL subtotal: {subtotal} | shipping_fee: {shipping_fee} | discount: {discount_amount} | total: {total_amount}")
            
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
