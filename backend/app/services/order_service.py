"""
Order Service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import asyncio

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product
from app.models.collection import Collection
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.loyalty_service import LoyaltyService
from app.services.notification_service import NotificationService
from app.services.chat_service import ChatService
from app.services.coupon_service import validate_and_apply_coupon, mark_coupon_as_used


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
            collection_products_map: dict = {}  # Track which products belong to collections
        
            # First, process collections if any
            if data.collections:
                for coll_data in data.collections:
                    # Validate collection exists
                    from app.models.product import Collection
                    collection = db.query(Collection)\
                        .filter(Collection.id == coll_data.collection_id)\
                        .first()
                    
                    if not collection:
                        raise NotFoundException(f"Collection {coll_data.collection_id} not found")
                    
                    # Calculate original price (sum of all products)
                    original_price = 0
                    for prod_id in coll_data.product_ids:
                        product = db.query(Product)\
                            .filter(Product.id == prod_id)\
                            .with_for_update()\
                            .first()
                        
                        if not product:
                            raise NotFoundException(f"Product {prod_id} not found")
                        
                        original_price += product.sale_price if product.sale_price else product.price
                        
                        # Mark this product as part of collection
                        collection_products_map[prod_id] = coll_data.collection_id
                    
                    # Use collection's sale_price instead of sum of individual prices
                    subtotal += coll_data.sale_price
            
            # Then process individual items
            for item_data in data.items:
                # CRITICAL: Use pessimistic locking to prevent race conditions
                # Lock the product row until transaction completes
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
            
                # Check if this product is part of a collection
                is_in_collection = item_data.product_id in collection_products_map
                
                if is_in_collection:
                    # Product is part of collection - price already counted in collection total
                    # But still create order item with price 0 to track the product
                    actual_price: float = 0
                    item_subtotal: float = 0
                else:
                    # Regular individual product - use normal pricing
                    actual_price = product.sale_price if product.sale_price else product.price
                    item_subtotal = actual_price * item_data.quantity
                    subtotal += item_subtotal
                
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
                    "price_at_purchase": actual_price if not is_in_collection else (product.sale_price or product.price),
                    "quantity": item_data.quantity,
                    "variant": item_data.variant
                })
                logger.info(f"[ORDER]   - Add order item: {product.name} | ProductID: {product.id} | Qty: {quantity} | Price: {actual_price}")
            
            # Calculate shipping fee (can be dynamic based on location)
            shipping_fee: float = 50000.0  # 50k VND flat rate
            
            # Apply VIP discount based on user's tier
            user = db.query(User).filter(User.id == user_id).first()
            vip_discount_percent = LoyaltyService.get_discount_percentage(user.vip_tier)
            discount_amount: float = subtotal * (vip_discount_percent / 100)
            
            # Apply coupon discount if provided
            coupon_obj = None
            if data.coupon_code:
                coupon_result = validate_and_apply_coupon(
                    db=db,
                    coupon_code=data.coupon_code,
                    user_id=user_id,
                    order_amount=subtotal + shipping_fee  # Apply coupon after VIP discount
                )
                
                if not coupon_result["valid"]:
                    raise BadRequestException(coupon_result["message"])
                
                discount_amount += coupon_result["discount"]
                coupon_obj = coupon_result.get("coupon")
            
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
            
            # Mark coupon as used if applied
            if coupon_obj:
                mark_coupon_as_used(db, coupon_obj, order.id)
            
            # Send order confirmation notification
            OrderService._send_order_created_notification(db, order, user)
            
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
            
            # If order marked as COMPLETED, ensure it is considered PAID
            # and financials are reconciled
            if (old_status != OrderStatus.COMPLETED and 
                order.status == OrderStatus.COMPLETED):
                order.is_paid = True
                # Mark all dues as cleared
                order.remaining_amount = 0
                # For consistency, set deposit to total when completed
                order.deposit_amount = order.total_amount

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
            
            # Send notifications for status changes
            if old_status != order.status:
                print(f"[DEBUG] Order status changed from {old_status} to {order.status}, sending notification...")
                OrderService._send_order_status_notification(db, order, old_status)
            else:
                print(f"[DEBUG] Order status unchanged: {order.status}")
            
            return order
            
        except NotFoundException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update order: {str(e)}")
    
    @staticmethod
    def _send_order_created_notification(db: Session, order: Order, user: User) -> None:
        """Send confirmation email when order is created"""
        try:
            # Get user email
            user_email = user.email
            if not user_email:
                return
            
            # Build order items summary
            items_html = "<ul>"
            for item in order.items:
                items_html += f"<li>{item.product_name} x{item.quantity} - {item.price_at_purchase:,.0f} VND</li>"
            items_html += "</ul>"
            
            # Create email content
            subject = f"Xác nhận đơn hàng #{order.id} - Luxe Furniture"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Cảm ơn bạn đã đặt hàng tại Luxe Furniture!</h2>
                <p>Chào <strong>{order.full_name}</strong>,</p>
                <p>Đơn hàng <strong>#{order.id}</strong> của bạn đã được tiếp nhận thành công.</p>
                
                <h3>Thông tin đơn hàng:</h3>
                <p><strong>Sản phẩm:</strong></p>
                {items_html}
                
                <p><strong>Tổng tiền hàng:</strong> {order.subtotal:,.0f} VND</p>
                <p><strong>Phí vận chuyển:</strong> {order.shipping_fee:,.0f} VND</p>
                <p><strong>Giảm giá:</strong> {order.discount_amount:,.0f} VND</p>
                <p><strong>Tổng cộng:</strong> {order.total_amount:,.0f} VND</p>
                
                <h3>Thông tin giao hàng:</h3>
                <p><strong>Người nhận:</strong> {order.full_name}</p>
                <p><strong>Số điện thoại:</strong> {order.phone_number}</p>
                <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                
                <p><strong>Phương thức thanh toán:</strong> {order.payment_method.value}</p>
                {f'<p><strong>Đã cọc:</strong> {order.deposit_amount:,.0f} VND</p>' if order.deposit_amount > 0 else ''}
                {f'<p><strong>Còn lại:</strong> {order.remaining_amount:,.0f} VND</p>' if order.remaining_amount > 0 else ''}
                
                <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.</p>
                <p>Mọi thắc mắc vui lòng liên hệ: <a href="mailto:support@luxefurniture.com">support@luxefurniture.com</a></p>
                
                <p style="margin-top: 30px; color: #666;">Trân trọng,<br>Đội ngũ Luxe Furniture</p>
            </body>
            </html>
            """
            
            # Send email via NotificationService
            NotificationService.create_notification(
                db=db,
                user_id=order.user_id,
                event_type="ORDER_CREATED",
                title=subject,
                message=f"Đơn hàng #{order.id} đã được tạo thành công. Tổng: {order.total_amount:,.0f} VND",
                data={
                    "order_id": order.id,
                    "total_amount": float(order.total_amount)
                },
                category="order_updates",
                channels=["email"],
                email_subject=subject,
                email_body=body,
                email_to=user_email
            )
            
            # Send notification via chat 24/7
            items_text = "\n".join([f"• {item.product_name} x{item.quantity}" for item in order.items])
            chat_message = f"""🎉 Đơn hàng đã được tạo thành công!

Cảm ơn bạn đã đặt hàng tại Luxe Furniture!

📦 Mã đơn hàng: #{order.id}
🛍️ Sản phẩm:
{items_text}

💰 Tổng cộng: {order.total_amount:,.0f} VND
📍 Địa chỉ: {order.shipping_address}

Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng."""
            
            ChatService.send_notification_to_user_chat(
                db=db,
                user_id=order.user_id,
                message=chat_message
            )
            
        except Exception as e:
            # Don't fail order creation if notification fails
            print(f"Failed to send order creation notification: {str(e)}")
    
    @staticmethod
    def _send_order_status_notification(db: Session, order: Order, old_status: OrderStatus) -> None:
        """Send notification email when order status changes"""
        print(f"[DEBUG] _send_order_status_notification called for order {order.id}, order.user_id={order.user_id}")
        try:
            # IMPORTANT: Always get email from the order's user, not the logged-in admin
            user = db.query(User).filter(User.id == order.user_id).first()
            if not user or not user.email:
                print(f"[DEBUG] User not found or no email: user_id={order.user_id}")
                return
            
            user_email = user.email
            print(f"[DEBUG] Sending notification to order owner: {user_email} (user_id={user.id})")
            
            # Map status to notification content
            notifications = {
                OrderStatus.CONFIRMED: {
                    "title": "Đơn hàng đã được xác nhận",
                    "message": f"Đơn hàng #{order.id} của bạn đã được xác nhận và đang được xử lý.",
                    "event_type": "ORDER_CONFIRMED"
                },
                OrderStatus.PROCESSING: {
                    "title": "Đơn hàng đang xử lý",
                    "message": f"Đơn hàng #{order.id} đang được đóng gói và chuẩn bị giao hàng.",
                    "event_type": "ORDER_PROCESSING"
                },
                OrderStatus.SHIPPING: {
                    "title": "Đơn hàng đang giao",
                    "message": f"Đơn hàng #{order.id} đã được giao cho đơn vị vận chuyển.",
                    "event_type": "ORDER_SHIPPING"
                },
                OrderStatus.COMPLETED: {
                    "title": "Đơn hàng hoàn thành",
                    "message": f"Đơn hàng #{order.id} đã hoàn thành. Cảm ơn bạn đã mua hàng!",
                    "event_type": "ORDER_COMPLETED"
                },
                OrderStatus.CANCELLED: {
                    "title": "Đơn hàng đã hủy",
                    "message": f"Đơn hàng #{order.id} đã bị hủy. Nếu đã thanh toán, chúng tôi sẽ hoàn tiền.",
                    "event_type": "ORDER_CANCELLED"
                },
                OrderStatus.REFUNDED: {
                    "title": "Đơn hàng đã hoàn tiền",
                    "message": f"Đơn hàng #{order.id} đã được hoàn tiền.",
                    "event_type": "ORDER_REFUNDED"
                }
            }
            
            if order.status not in notifications:
                return
            
            notif_data = notifications[order.status]
            
            # Create HTML email body with contact information
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>{notif_data['title']}</h2>
                <p>Chào <strong>{order.full_name}</strong>,</p>
                <p>{notif_data['message']}</p>
                
                <h3>Thông tin đơn hàng:</h3>
                <p><strong>Mã đơn hàng:</strong> #{order.id}</p>
                <p><strong>Người nhận:</strong> {order.full_name}</p>
                <p><strong>Email:</strong> {user_email}</p>
                <p><strong>Số điện thoại:</strong> {order.phone_number}</p>
                <p><strong>Địa chỉ giao hàng:</strong> {order.shipping_address}</p>
                <p><strong>Tổng giá trị:</strong> {order.total_amount:,.0f} VND</p>
                <p><strong>Trạng thái:</strong> {order.status if isinstance(order.status, str) else order.status.value}</p>
                
                <p style="margin-top: 20px;">Bạn có thể xem chi tiết đơn hàng tại: <a href="http://localhost:3000/orders">Đơn hàng của tôi</a></p>
                
                <p style="margin-top: 30px; color: #666;">Trân trọng,<br>Đội ngũ Luxe Furniture</p>
            </body>
            </html>
            """
            
            # Send notification to order owner's email
            print(f"[DEBUG] Calling NotificationService.create_notification with email_to={user_email}")
            NotificationService.create_notification(
                db=db,
                user_id=order.user_id,
                event_type=notif_data["event_type"],
                title=notif_data["title"],
                message=notif_data["message"],
                data={
                    "order_id": order.id,
                    "total_amount": float(order.total_amount),
                    "old_status": old_status if isinstance(old_status, str) else (old_status.value if old_status else None),
                    "new_status": order.status if isinstance(order.status, str) else order.status.value
                },
                category="order_updates",
                channels=["email"],
                email_subject=notif_data["title"],
                email_body=email_body,
                email_to=user_email
            )
            
            # Send notification via chat 24/7
            chat_message = f"""🔔 {notif_data['title']}

{notif_data['message']}

📦 Mã đơn hàng: #{order.id}
💰 Tổng giá trị: {order.total_amount:,.0f} VND
📍 Trạng thái: {order.status if isinstance(order.status, str) else order.status.value}

Bạn có thể xem chi tiết đơn hàng tại: http://localhost:3000/orders"""
            
            ChatService.send_notification_to_user_chat(
                db=db,
                user_id=order.user_id,
                message=chat_message
            )
            
        except Exception as e:
            # Don't fail order update if notification fails
            print(f"Failed to send order status notification: {str(e)}")
    
    @staticmethod
    async def _send_order_notification(db: Session, order: Order, old_status: OrderStatus) -> None:
        """Send notification for order status change"""
        # Map status to notification content
        notifications = {
            OrderStatus.CONFIRMED: {
                "title": "Đơn hàng đã được xác nhận",
                "message": f"Đơn hàng #{order.id} của bạn đã được xác nhận và đang được xử lý. Tổng giá trị: {order.total_amount:,.0f} VND",
                "event_type": "ORDER_CONFIRMED"
            },
            OrderStatus.PROCESSING: {
                "title": "Đơn hàng đang xử lý",
                "message": f"Đơn hàng #{order.id} đang được đóng gói và chuẩn bị giao hàng.",
                "event_type": "ORDER_PROCESSING"
            },
            OrderStatus.SHIPPING: {
                "title": "Đơn hàng đang giao",
                "message": f"Đơn hàng #{order.id} đã được giao cho đơn vị vận chuyển. Vui lòng kiểm tra điện thoại để nhận hàng.",
                "event_type": "ORDER_SHIPPING"
            },
            OrderStatus.COMPLETED: {
                "title": "Đơn hàng hoàn thành",
                "message": f"Đơn hàng #{order.id} đã hoàn thành. Cảm ơn bạn đã mua hàng tại Luxe Furniture!",
                "event_type": "ORDER_COMPLETED"
            },
            OrderStatus.CANCELLED: {
                "title": "Đơn hàng đã hủy",
                "message": f"Đơn hàng #{order.id} đã bị hủy. Nếu bạn đã thanh toán, chúng tôi sẽ hoàn tiền trong 3-5 ngày làm việc.",
                "event_type": "ORDER_CANCELLED"
            },
            OrderStatus.REFUNDED: {
                "title": "Đơn hàng đã hoàn tiền",
                "message": f"Đơn hàng #{order.id} đã được hoàn tiền. Số tiền sẽ được chuyển về tài khoản của bạn.",
                "event_type": "ORDER_REFUNDED"
            }
        }
        
        if order.status in notifications:
            notif_data = notifications[order.status]
            await NotificationService.send_notification(
                db=db,
                user_id=order.user_id,
                event_type=notif_data["event_type"],
                title=notif_data["title"],
                message=notif_data["message"],
                data={
                    "order_id": order.id,
                    "order_id": order.id,
                    "total_amount": order.total_amount,
                    "old_status": old_status.value if old_status else None,
                    "new_status": order.status.value
                },
                category="order_updates"
            )
