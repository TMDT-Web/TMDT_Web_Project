from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["Inventory"])

from . import list_suppliers, create_supplier, list_purchase_orders, create_purchase_order  # noqa: E402,F401

__all__ = ["router"]
