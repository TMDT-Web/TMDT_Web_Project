from fastapi import APIRouter

router = APIRouter(prefix="/cart", tags=["Cart"])

from . import get_cart_items, add_to_cart, update_cart_item, remove_cart_item, clear_cart  # noqa: E402,F401

__all__ = ["router"]
