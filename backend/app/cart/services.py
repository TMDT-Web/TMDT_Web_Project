from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cart import schemas
from app.cart.models import CartItem
from app.products.models import Product
from app.users.models import User


def get_cart_items(db: Session, user: User) -> list[CartItem]:
    return (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id)
        .order_by(CartItem.created_at.desc())
        .all()
    )


def add_to_cart(db: Session, user: User, payload: schemas.CartItemCreate) -> CartItem:
    if payload.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")
    product = db.get(Product, payload.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    if product.stock_quantity < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if item:
        new_quantity = item.quantity + payload.quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
        item.quantity = new_quantity
    else:
        item = CartItem(user_id=user.id, product_id=payload.product_id, quantity=payload.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_cart_item(db: Session, user: User, cart_item_id: int, payload: schemas.CartItemUpdate) -> CartItem | None:
    if payload.quantity < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be non-negative")
    item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    if payload.quantity == 0:
        db.delete(item)
        db.commit()
        return None

    product = db.get(Product, item.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if payload.quantity > product.stock_quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return item


def remove_cart_item(db: Session, user: User, cart_item_id: int) -> None:
    item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(item)
    db.commit()


def clear_cart(db: Session, user: User) -> None:
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
