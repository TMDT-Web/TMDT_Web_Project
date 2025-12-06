from __future__ import annotations

from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.rewards import schemas, services
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.post("/redeem", response_model=schemas.RedeemVoucherResponse, status_code=status.HTTP_201_CREATED)
def redeem_voucher(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.RedeemVoucherResponse:
    voucher = services.redeem_points_to_voucher(db, current_user)
    account = services.get_reward_account(db, current_user)
    return schemas.RedeemVoucherResponse(
        voucher=schemas.VoucherRead.model_validate(voucher),
        balance=schemas.RewardPointRead.model_validate(account),
    )
