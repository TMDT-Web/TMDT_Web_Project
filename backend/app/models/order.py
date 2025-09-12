from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Numeric, CheckConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Order(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "order_orders"
    
    buyer_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="RESTRICT"), nullable=False)
    status = Column(Enum('created', 'awaiting_payment', 'paid', 'packed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', name='order_status'), nullable=False, default='created')
    subtotal = Column(Numeric(14, 2), nullable=False, default=0)
    shipping_fee = Column(Numeric(14, 2), nullable=False, default=0)
    discount_total = Column(Numeric(14, 2), nullable=False, default=0)
    tax_total = Column(Numeric(14, 2), nullable=False, default=0)
    grand_total = Column(Numeric(14, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default='VND')
    shipping_address_snapshot = Column(JSON, nullable=False)
    escrow_state = Column(String(64))
    
    # Relationships
    buyer = relationship("User")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    returns = relationship("Return", back_populates="order", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_orders_buyer', 'buyer_id'),
        Index('idx_orders_status', 'status'),
    )

class OrderItem(Base, UUIDMixin):
    __tablename__ = "order_order_items"
    
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(BINARY(16), ForeignKey("catalog_listings.id", ondelete="RESTRICT"), nullable=False)
    seller_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="RESTRICT"), nullable=False)  # shop id
    variant_id = Column(BINARY(16), ForeignKey("catalog_listing_variants.id", ondelete="SET NULL"))
    qty = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    attrs = Column(JSON)
    unit_price = Column(Numeric(14, 2), nullable=False)
    commission_rate = Column(Numeric(5, 2), nullable=False, default=0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    listing = relationship("Listing")
    seller = relationship("Shop")
    variant = relationship("ListingVariant")
    returns = relationship("Return", back_populates="order_item", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="order_item")
    
    __table_args__ = (
        CheckConstraint('qty > 0', name='ck_order_items_qty_positive'),
        CheckConstraint('unit_price >= 0', name='ck_order_items_unit_price_positive'),
        Index('idx_order_items_order', 'order_id'),
        Index('idx_order_items_seller', 'seller_id'),
    )

class Return(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "order_returns"
    
    order_id = Column(BINARY(16), ForeignKey("order_orders.id", ondelete="CASCADE"), nullable=False)
    order_item_id = Column(BINARY(16), ForeignKey("order_order_items.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(255))
    evidence = Column(JSON)
    status = Column(String(64), nullable=False, default='requested')
    
    # Relationships
    order = relationship("Order", back_populates="returns")
    order_item = relationship("OrderItem", back_populates="returns")
    
    __table_args__ = (
        Index('idx_returns_order', 'order_id'),
    )
