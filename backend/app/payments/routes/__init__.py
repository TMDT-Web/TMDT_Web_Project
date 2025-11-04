from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Payments"])

from . import initiate_payment, payment_callback, list_payments  # noqa: E402,F401

__all__ = ["router"]
