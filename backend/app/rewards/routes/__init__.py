from fastapi import APIRouter

router = APIRouter(prefix="/rewards", tags=["Rewards"])

from . import get_my_rewards, redeem_voucher  # noqa: E402,F401

__all__ = ["router"]
