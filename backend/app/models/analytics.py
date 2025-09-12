from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class DomainEvent(Base, UUIDMixin):
    __tablename__ = "analytics_domain_events"
    
    event_name = Column(String(128), nullable=False)
    occurred_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    actor_user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="SET NULL"))
    entity_type = Column(String(64))
    entity_id = Column(BINARY(16))
    payload = Column(JSON)
    
    # Relationships
    actor = relationship("User")
    
    __table_args__ = (
        Index('idx_events_time', 'occurred_at'),
        Index('idx_events_name', 'event_name'),
    )
