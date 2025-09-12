from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Index, DateTime, func, CheckConstraint, Boolean
from sqlalchemy.dialects.mysql import BINARY, MEDIUMTEXT
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Review(Base, UUIDMixin):
    __tablename__ = "review_reviews"
    
    listing_id = Column(BINARY(16), ForeignKey("catalog_listings.id", ondelete="SET NULL"))
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="SET NULL"))
    order_item_id = Column(BINARY(16), ForeignKey("order_order_items.id", ondelete="SET NULL"), unique=True)
    reviewer_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="RESTRICT"), nullable=False)
    rating = Column(Integer, nullable=False)
    content = Column(MEDIUMTEXT)
    media = Column(JSON)
    status = Column(Enum('pending', 'approved', 'rejected', name='review_status'), nullable=False, default='approved')
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    listing = relationship("Listing")
    shop = relationship("Shop")
    order_item = relationship("OrderItem", back_populates="reviews")
    reviewer = relationship("User")
    helpfulness = relationship("ReviewHelpfulness", back_populates="review", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('rating BETWEEN 1 AND 5', name='ck_reviews_rating_range'),
        Index('idx_reviews_listing', 'listing_id'),
        Index('idx_reviews_shop', 'shop_id'),
    )

class ReviewHelpfulness(Base):
    __tablename__ = "review_review_helpfulness"
    
    review_id = Column(BINARY(16), ForeignKey("review_reviews.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BINARY(16), ForeignKey("identity_users.id", ondelete="CASCADE"), primary_key=True)
    is_helpful = Column(Boolean, nullable=False)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    review = relationship("Review", back_populates="helpfulness")
    user = relationship("User")
