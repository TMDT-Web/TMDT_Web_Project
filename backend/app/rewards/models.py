from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.users.models import User


class VoucherStatus(str, Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"


class RewardPoint(Base):
    __tablename__ = "reward_points"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    points: Mapped[int] = mapped_column(Integer, default=0)
    tier: Mapped[str] = mapped_column(String(50), default="standard")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="reward_point")
    transactions: Mapped[List["PointTransaction"]] = relationship(
        "PointTransaction", back_populates="reward_point", cascade="all, delete-orphan"
    )


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    change: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_id: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reward_point: Mapped["RewardPoint"] = relationship(
        "RewardPoint",
        primaryjoin="PointTransaction.user_id==RewardPoint.user_id",
        back_populates="transactions",
    )


class Voucher(Base):
    __tablename__ = "vouchers"
    __table_args__ = (UniqueConstraint("code", name="uq_voucher_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    points_redeemed: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[VoucherStatus] = mapped_column(
        SQLEnum(VoucherStatus, name="voucher_status_enum"), default=VoucherStatus.ACTIVE
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    redeemed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="vouchers")
