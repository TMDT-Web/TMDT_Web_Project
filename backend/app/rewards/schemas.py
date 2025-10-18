from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.rewards.models import VoucherStatus
from app.schemas.base import OrmBaseModel


class RewardPointRead(OrmBaseModel):
    user_id: int
    points: int
    tier: str
    updated_at: datetime


class PointTransactionRead(OrmBaseModel):
    id: int
    change: int
    balance_after: int
    description: Optional[str]
    order_id: Optional[int]
    created_at: datetime


class VoucherRead(OrmBaseModel):
    id: int
    code: str
    value: int
    status: VoucherStatus
    expires_at: Optional[datetime]
    redeemed_at: Optional[datetime]
    created_at: datetime


class RedeemVoucherResponse(OrmBaseModel):
    voucher: VoucherRead
    balance: RewardPointRead


class RewardDashboard(OrmBaseModel):
    points: RewardPointRead
    vouchers: List[VoucherRead]
    transactions: List[PointTransactionRead]
