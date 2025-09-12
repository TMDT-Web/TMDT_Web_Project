from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Numeric, CheckConstraint, Index, Date, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payment_payments"
    
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(64), nullable=False)  # VNPay/MoMo/Stripe
    method = Column(String(32), nullable=False)    # card, wallet, bank_transfer
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='VND')
    status = Column(Enum('pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled', name='payment_status'), nullable=False, default='pending')
    provider_ref = Column(String(255))
    idempotency_key = Column(String(128))
    risk_score = Column(Numeric(6, 2))
    paid_at = Column(DateTime(6))
    
    # Relationships
    order = relationship("Order", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('amount >= 0', name='ck_payments_amount_positive'),
        UniqueConstraint('order_id', 'provider', 'idempotency_key', name='uq_payment_idem'),
        Index('idx_payments_order', 'order_id'),
        Index('idx_payments_status', 'status'),
    )

class Refund(Base, UUIDMixin):
    __tablename__ = "payment_refunds"
    
    payment_id = Column(BINARY(16), ForeignKey("payment_payments.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    reason = Column(String(255))
    processed_at = Column(DateTime(6))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    payment = relationship("Payment", back_populates="refunds")
    
    __table_args__ = (
        CheckConstraint('amount >= 0', name='ck_refunds_amount_positive'),
        Index('idx_refunds_payment', 'payment_id'),
    )

class FeeRule(Base, UUIDMixin):
    __tablename__ = "payment_fee_rules"
    
    category_id = Column(BINARY(16), ForeignKey("catalog_categories.id", ondelete="SET NULL"))
    commission_rate = Column(Numeric(5, 2), nullable=False, default=0)
    effective_from = Column(DateTime(6), nullable=False)
    effective_to = Column(DateTime(6))
    
    # Relationships
    category = relationship("Category")

class LedgerAccount(Base, UUIDMixin):
    __tablename__ = "payment_ledger_accounts"
    
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="CASCADE"))  # null = platform-level
    code = Column(String(64), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum('asset', 'liability', 'income', 'expense', 'equity', name='account_type'), nullable=False)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    shop = relationship("Shop")
    postings = relationship("LedgerPosting", back_populates="account", cascade="all, delete-orphan")

class LedgerJournal(Base, UUIDMixin):
    __tablename__ = "payment_ledger_journals"
    
    ref = Column(String(255))
    description = Column(String(1024))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    postings = relationship("LedgerPosting", back_populates="journal", cascade="all, delete-orphan")

class LedgerPosting(Base, UUIDMixin):
    __tablename__ = "payment_ledger_postings"
    
    journal_id = Column(BINARY(16), ForeignKey("payment_ledger_journals.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(BINARY(16), ForeignKey("payment_ledger_accounts.id", ondelete="RESTRICT"), nullable=False)
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="SET NULL"))
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='VND')
    direction = Column(Enum('debit', 'credit', name='posting_direction'), nullable=False)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    journal = relationship("LedgerJournal", back_populates="postings")
    account = relationship("LedgerAccount", back_populates="postings")
    order = relationship("Order")
    
    __table_args__ = (
        CheckConstraint('amount >= 0', name='ck_postings_amount_positive'),
        Index('idx_postings_account', 'account_id'),
        Index('idx_postings_journal', 'journal_id'),
    )

class Settlement(Base, UUIDMixin):
    __tablename__ = "payment_settlements"
    
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    gross_revenue = Column(Numeric(14, 2), nullable=False, default=0)
    refunds_total = Column(Numeric(14, 2), nullable=False, default=0)
    fees_total = Column(Numeric(14, 2), nullable=False, default=0)
    net_payable = Column(Numeric(14, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default='VND')
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    shop = relationship("Shop")
    payouts = relationship("Payout", back_populates="settlement", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('shop_id', 'period_start', 'period_end', name='uq_settlement_period'),
    )

class Payout(Base, UUIDMixin):
    __tablename__ = "payment_payouts"
    
    settlement_id = Column(BINARY(16), ForeignKey("payment_settlements.id", ondelete="CASCADE"), nullable=False)
    bank_ref = Column(String(255))
    amount = Column(Numeric(14, 2), nullable=False)
    paid_at = Column(DateTime(6))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    settlement = relationship("Settlement", back_populates="payouts")
