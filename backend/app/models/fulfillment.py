from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Shipment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "fulfillment_shipments"
    
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="RESTRICT"), nullable=False)
    carrier = Column(String(64), nullable=False)
    service = Column(String(64))
    tracking_no = Column(String(128), unique=True)
    label_url = Column(String(1024))
    status = Column(Enum('pending', 'label_created', 'in_transit', 'delivered', 'lost', 'returned', name='shipment_status'), nullable=False, default='pending')
    shipped_at = Column(DateTime(6))
    delivered_at = Column(DateTime(6))
    
    # Relationships
    order = relationship("Order", back_populates="shipments")
    seller = relationship("Shop")
    
    __table_args__ = (
        Index('idx_shipments_order', 'order_id'),
        Index('idx_shipments_seller', 'seller_id'),
    )
