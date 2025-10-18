from __future__ import annotations

import math
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.rewards.models import PointTransaction, RewardPoint, Voucher, VoucherStatus
from app.users.models import User


def get_reward_account(db: Session, user: User) -> RewardPoint:
    account = (
        db.execute(select(RewardPoint).where(RewardPoint.user_id == user.id)).scalar_one_or_none()
    )
    if not account:
        account = RewardPoint(user_id=user.id, points=0, tier="standard")
        db.add(account)
        db.flush()
    return account


def log_transaction(db: Session, user_id: int, change: int, balance_after: int, description: str, order_id: int | None = None) -> None:
    transaction = PointTransaction(
        user_id=user_id,
        change=change,
        balance_after=balance_after,
        description=description,
        order_id=order_id,
        created_at=datetime.utcnow(),
    )
    db.add(transaction)


def award_points_for_order(db: Session, user: User, order_id: int, order_total: float) -> int:
    account = get_reward_account(db, user)
    earned_points = max(int(order_total * settings.reward_point_rate), 0)
    if earned_points <= 0:
        return 0
    account.points += earned_points
    account.updated_at = datetime.utcnow()
    log_transaction(
        db, user.id, change=earned_points, balance_after=account.points, description=f"Earned points from order {order_id}", order_id=order_id
    )
    return earned_points


def apply_points_to_order(db: Session, user: User, order_id: int, total_amount: float) -> Tuple[float, int, int]:
    account = get_reward_account(db, user)
    if account.points < settings.points_per_voucher:
        return total_amount, 0, 0

    usable_sets = account.points // settings.points_per_voucher
    max_discount = usable_sets * settings.voucher_value
    discount = min(max_discount, total_amount)
    if discount <= 0:
        return total_amount, 0, 0

    sets_needed = min(usable_sets, math.ceil(discount / settings.voucher_value))
    points_used = sets_needed * settings.points_per_voucher
    discount_amount = min(sets_needed * settings.voucher_value, total_amount)

    account.points -= points_used
    account.updated_at = datetime.utcnow()
    log_transaction(
        db,
        user.id,
        change=-points_used,
        balance_after=account.points,
        description=f"Redeemed points for order {order_id}",
        order_id=order_id,
    )
    return total_amount - discount_amount, points_used, int(discount_amount)


def generate_voucher_code() -> str:
    return secrets.token_urlsafe(6).upper()


def redeem_points_to_voucher(db: Session, user: User) -> Voucher:
    account = get_reward_account(db, user)
    if account.points < settings.points_per_voucher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough points")
    account.points -= settings.points_per_voucher
    account.updated_at = datetime.utcnow()
    log_transaction(
        db,
        user.id,
        change=-settings.points_per_voucher,
        balance_after=account.points,
        description="Redeemed voucher",
    )

    voucher = Voucher(
        code=generate_voucher_code(),
        user_id=user.id,
        value=settings.voucher_value,
        points_redeemed=settings.points_per_voucher,
        status=VoucherStatus.ACTIVE,
        expires_at=datetime.utcnow() + timedelta(days=90),
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher


def apply_voucher_code(db: Session, user: User, code: str) -> Voucher:
    voucher = (
        db.query(Voucher)
        .filter(Voucher.code == code)
        .with_for_update()
        .first()
    )
    if not voucher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voucher not found")
    if voucher.status != VoucherStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher already used")
    if voucher.expires_at and voucher.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher expired")
    if voucher.user_id and voucher.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Voucher not assigned to user")

    voucher.status = VoucherStatus.REDEEMED
    voucher.redeemed_at = datetime.utcnow()
    db.flush()
    return voucher


def refund_points(db: Session, user: User, points: int, order_id: Optional[int] = None) -> None:
    account = get_reward_account(db, user)
    account.points += points
    account.updated_at = datetime.utcnow()
    log_transaction(
        db,
        user.id,
        change=points,
        balance_after=account.points,
        description="Points refunded",
        order_id=order_id,
    )
