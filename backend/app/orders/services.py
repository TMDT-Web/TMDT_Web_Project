from __future__ import annotations

import random
import string
from datetime import datetime
from decimal import Decimal
from typing import List, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.cart.models import CartItem
from app.cart import services as cart_services
from app.orders import schemas
from app.orders.models import Order, OrderItem, OrderPaymentStatusEnum, OrderStatusEnum
from app.payments.models import Payment, PaymentGatewayEnum, PaymentStatusEnum
from app.payments import schemas as payment_schemas
from app.payments import services as payment_services
from app.products.models import Product
from app.rewards import services as reward_services
from app.users.models import User


def generate_order_number() -> str:
    now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = "".join(random.choices(string.digits, k=4))
    return f"ORD-{now}-{suffix}"


def get_orders_for_user(db: Session, user: User, page: int, size: int) -> Tuple[List[Order], int]:
    query = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    )
    total = query.count()
    orders = (
        query.offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return orders, total


def get_order(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.payments), joinedload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def create_order(
    db: Session,
    user: User,
    payload: schemas.OrderCreate,
) -> tuple[Order, payment_schemas.PaymentInitResponse | None]:
    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    for item in cart_items:
        if not item.product or not item.product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart contains inactive products")
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock for product")

    subtotal = sum(Decimal(item.product.price) * item.quantity for item in cart_items)  # type: ignore[arg-type]
    order = Order(
        user_id=user.id,
        order_number=generate_order_number(),
        status=OrderStatusEnum.PENDING,
        payment_status=OrderPaymentStatusEnum.PENDING,
        total_amount=subtotal,
        shipping_address=payload.shipping_address,
        shipping_contact_name=payload.shipping_contact_name,
        shipping_contact_phone=payload.shipping_contact_phone,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        product = item.product
        if not product:
            continue
        line_total = Decimal(product.price) * item.quantity  # type: ignore[arg-type]
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=product.price,
            total_price=line_total,
        )
        db.add(order_item)
        product.stock_quantity -= item.quantity

    db.flush()

    voucher_discount = Decimal(0)
    if payload.voucher_code:
        voucher = reward_services.apply_voucher_code(db, user, payload.voucher_code)
        voucher_discount = Decimal(voucher.value)
        order.voucher_code = voucher.code

    total_after_voucher = max(order.total_amount - voucher_discount, Decimal(0))
    order.total_amount = total_after_voucher

    points_used = 0
    if payload.use_reward_points:
        new_total, used_points, discount_value = reward_services.apply_points_to_order(
            db, user, order.id, float(order.total_amount)
        )
        order.total_amount = Decimal(new_total)
        points_used = used_points
        order.reward_points_used = used_points

    db.commit()

    cart_services.clear_cart(db, user)

    payment_response: payment_schemas.PaymentInitResponse | None = None
    if order.total_amount <= 0:
        order.payment_status = OrderPaymentStatusEnum.PAID
        order.status = OrderStatusEnum.PROCESSING
        db.commit()
    else:
        payment, payment_response = await await_payment(
            db, order, payload.payment_gateway, float(order.total_amount)
        )
        if payment.status == PaymentStatusEnum.SUCCESS:
            order.payment_status = OrderPaymentStatusEnum.PAID
            order.status = OrderStatusEnum.PROCESSING

    earned_points = reward_services.award_points_for_order(db, user, order.id, float(order.total_amount))
    order.reward_points_earned = earned_points
    db.commit()
    db.refresh(order)

    return order, payment_response


async def await_payment(
    db: Session,
    order: Order,
    gateway: PaymentGatewayEnum,
    amount: float,
) -> tuple[Payment, payment_schemas.PaymentInitResponse]:
    payment, response = await payment_services.initiate_with_fallback(
        db,
        order=order,
        preferred_gateway=gateway,
        amount=amount,
        metadata={"order_number": order.order_number},
    )
    return payment, response


def update_order_status(
    db: Session,
    order: Order,
    status_update: schemas.OrderStatusUpdate,
) -> Order:
    order.status = status_update.status
    if status_update.notes is not None:
        order.notes = status_update.notes
    db.commit()
    db.refresh(order)
    return order


def admin_list_orders(db: Session, page: int, size: int) -> tuple[list[Order], int]:
    query = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())
    total = query.count()
    orders = query.offset((page - 1) * size).limit(size).all()
    return orders, total


def cancel_order(db: Session, order: Order, user: User) -> Order:
    if order.status in (OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be cancelled")

    for item in order.items:
        product = db.get(Product, item.product_id)
        if product:
            product.stock_quantity += item.quantity

    if order.reward_points_used:
        reward_services.refund_points(db, user, order.reward_points_used, order_id=order.id)

    order.status = OrderStatusEnum.CANCELLED
    order.payment_status = OrderPaymentStatusEnum.REFUNDED
    db.commit()
    db.refresh(order)
    return order
