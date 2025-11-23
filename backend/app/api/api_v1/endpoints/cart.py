"""
Cart Endpoints
"""
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate, CartSummary
from app.services.cart_service import CartService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's cart"""
    cart = CartService.get_cart(db, current_user.id)
    return cart


@router.get("/summary", response_model=CartSummary)
def get_cart_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cart with calculated totals"""
    summary = CartService.get_cart_summary(db, current_user.id)
    return summary


@router.post("/add", response_model=CartResponse)
def add_to_cart(
    data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add product to cart (or update quantity if exists)"""
    cart = CartService.add_item(db, current_user.id, data)
    return cart


@router.put("/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int = Path(..., gt=0),
    data: CartItemUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    cart = CartService.update_item(db, current_user.id, item_id, data)
    return cart


@router.delete("/{item_id}", response_model=CartResponse)
def remove_from_cart(
    item_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    cart = CartService.remove_item(db, current_user.id, item_id)
    return cart


@router.delete("", response_model=dict)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items from cart"""
    CartService.clear_cart(db, current_user.id)
    return {"message": "Cart cleared successfully"}
