from fastapi import APIRouter

router = APIRouter(prefix="/orders", tags=["Orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["Orders"])

from . import create_order, list_orders, get_order_detail, cancel_order  # noqa: E402,F401
from . import admin_list_orders, update_order_status  # noqa: E402,F401

router.include_router(admin_router)

__all__ = ["router"]
