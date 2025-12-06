from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.rewards import schemas, services
from app.rewards.models import PointTransaction, RewardPoint, Voucher
from app.users import dependencies as deps
from app.users.models import User

router = APIRouter(prefix="/rewards", tags=["Rewards"])


@router.get("/me", response_model=schemas.RewardDashboard)
def get_my_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> schemas.RewardDashboard:
    account = services.get_reward_account(db, current_user)
    vouchers = db.query(Voucher).filter(
        or_(Voucher.user_id == current_user.id, Voucher.user_id.is_(None))
    ).order_by(Voucher.created_at.desc()).all()
    transactions = (
        db.query(PointTransaction)
        .filter(PointTransaction.user_id == current_user.id)
        .order_by(PointTransaction.created_at.desc())
        .limit(20)
        .all()
    )
    return schemas.RewardDashboard(
        points=schemas.RewardPointRead.model_validate(account),
        vouchers=[schemas.VoucherRead.model_validate(voucher) for voucher in vouchers],
        transactions=[schemas.PointTransactionRead.model_validate(tx) for tx in transactions],
    )


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
