from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func, Numeric
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class ModerationQueue(Base, UUIDMixin):
    __tablename__ = "tns_moderation_queue"
    
    entity_type = Column(String(64), nullable=False)  # listing, review, message
    entity_id = Column(BINARY(16), nullable=False)
    reason = Column(String(255))
    model_score = Column(Numeric(6, 2))
    status = Column(Enum('pending', 'approved', 'rejected', name='moderation_status'), nullable=False, default='pending')
    decided_by = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="SET NULL"))
    decided_at = Column(DateTime(6))
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    decider = relationship("User")
    
    __table_args__ = (
        Index('idx_moderation_entity', 'entity_type', 'entity_id'),
    )

class Dispute(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tns_disputes"
    
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="CASCADE"), nullable=False)
    opened_by = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="RESTRICT"), nullable=False)
    role = Column(Enum('buyer', 'seller', name='dispute_role'), nullable=False)
    reason = Column(String(255))
    evidence = Column(JSON)
    status = Column(Enum('open', 'resolved', 'rejected', name='dispute_status'), nullable=False, default='open')
    result = Column(String(1024))
    
    # Relationships
    order = relationship("Order", back_populates="disputes")
    opener = relationship("User")
    
    __table_args__ = (
        Index('idx_disputes_order', 'order_id'),
    )
