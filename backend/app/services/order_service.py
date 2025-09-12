from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from app.models.identity import User
from app.models.shop import Shop
from app.models.order import Order, OrderItem
from app.models.catalog import Listing
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from typing import List, Optional
from decimal import Decimal

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, order_data: OrderCreate, user: User) -> OrderResponse:
        # Calculate totals
        subtotal = Decimal('0')
        items_data = []
        
        for item_data in order_data.items:
            # Get listing
            result = await self.db.execute(
                select(Listing).where(Listing.id == item_data.listing_id)
            )
            listing = result.scalar_one_or_none()
            
            if not listing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Listing {item_data.listing_id} not found"
                )
            
            if listing.status != "active":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Listing {listing.title} is not available"
                )
            
            if listing.stock < item_data.qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {listing.title}"
                )
            
            # Get shop
            result = await self.db.execute(
                select(Shop).where(Shop.id == listing.shop_id)
            )
            shop = result.scalar_one_or_none()
            
            if not shop:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Shop not found"
                )
            
            item_total = item_data.unit_price * item_data.qty
            subtotal += item_total
            
            items_data.append({
                'listing_id': item_data.listing_id,
                'seller_id': shop.id,
                'variant_id': item_data.variant_id,
                'qty': item_data.qty,
                'title': listing.title,
                'unit_price': item_data.unit_price,
                'attrs': None,  # TODO: Get from variant if exists
                'commission_rate': Decimal('5.0'),  # TODO: Get from fee rules
                'tax_rate': Decimal('10.0')  # TODO: Calculate based on location
            })
        
        # Calculate totals
        shipping_fee = Decimal('0')  # TODO: Calculate based on shipping rules
        discount_total = Decimal('0')  # TODO: Apply discounts
        tax_total = subtotal * Decimal('0.1')  # TODO: Calculate properly
        grand_total = subtotal + shipping_fee + tax_total - discount_total
        
        # Create order
        order = Order(
            buyer_id=user.id,
            status="created",
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            discount_total=discount_total,
            tax_total=tax_total,
            grand_total=grand_total,
            currency="VND",
            shipping_address_snapshot=order_data.shipping_address_snapshot,
            escrow_state="pending"
        )
        
        self.db.add(order)
        await self.db.flush()  # Get order ID
        
        # Create order items
        for item_data in items_data:
            order_item = OrderItem(
                order_id=order.id,
                listing_id=item_data['listing_id'],
                seller_id=item_data['seller_id'],
                variant_id=item_data['variant_id'],
                qty=item_data['qty'],
                title=item_data['title'],
                attrs=item_data['attrs'],
                unit_price=item_data['unit_price'],
                commission_rate=item_data['commission_rate'],
                tax_rate=item_data['tax_rate']
            )
            self.db.add(order_item)
        
        await self.db.commit()
        await self.db.refresh(order)
        
        return OrderResponse.model_validate(order)

    async def get_user_orders(
        self, 
        user_id: str, 
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[OrderResponse]:
        query = select(Order).where(Order.buyer_id == user_id)
        
        if status_filter:
            query = query.where(Order.status == status_filter)
        
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        orders = result.scalars().all()
        
        return [OrderResponse.model_validate(order) for order in orders]

    async def get_order(self, order_id: str, user: User) -> OrderResponse:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if user is buyer or seller
        if order.buyer_id != user.id:
            # Check if user is seller
            result = await self.db.execute(
                select(OrderItem).join(Shop).where(
                    and_(
                        OrderItem.order_id == order_id,
                        Shop.owner_user_id == user.id
                    )
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return OrderResponse.model_validate(order)

    async def update_order_status(self, order_id: str, new_status: str, user: User) -> OrderResponse:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check permissions based on status change
        if new_status in ["packed", "shipped"]:
            # Only seller can change to these statuses
            result = await self.db.execute(
                select(OrderItem).join(Shop).where(
                    and_(
                        OrderItem.order_id == order_id,
                        Shop.owner_user_id == user.id
                    )
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        elif new_status == "cancelled":
            # Only buyer can cancel
            if order.buyer_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        order.status = new_status
        await self.db.commit()
        await self.db.refresh(order)
        
        return OrderResponse.model_validate(order)

    async def cancel_order(self, order_id: str, user: User) -> OrderResponse:
        return await self.update_order_status(order_id, "cancelled", user)

    async def get_seller_orders(
        self, 
        user_id: str, 
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[OrderResponse]:
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
        
        # Get orders for this shop
        query = select(Order).join(OrderItem).where(OrderItem.seller_id == shop.id)
        
        if status_filter:
            query = query.where(Order.status == status_filter)
        
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        orders = result.scalars().all()
        
        return [OrderResponse.model_validate(order) for order in orders]

    async def pack_order(self, order_id: str, user: User) -> OrderResponse:
        return await self.update_order_status(order_id, "packed", user)

    async def ship_order(self, order_id: str, tracking_no: str, carrier: str, user: User) -> OrderResponse:
        # TODO: Create shipment record
        return await self.update_order_status(order_id, "shipped", user)
