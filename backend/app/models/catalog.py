from sqlalchemy import Column, String, Integer, Enum, ForeignKey, JSON, UniqueConstraint, Text, Numeric, CheckConstraint, Index, DateTime, func
from sqlalchemy.dialects.mysql import BINARY, MEDIUMTEXT
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

class Category(Base, UUIDMixin):
    __tablename__ = "catalog_categories"
    
    parent_id = Column(BINARY(16), ForeignKey("catalog_categories.id", ondelete="SET NULL"))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    parent = relationship("Category", remote_side="Category.id")
    children = relationship("Category", back_populates="parent")
    listings = relationship("Listing", back_populates="category")
    category_attributes = relationship("CategoryAttribute", back_populates="category", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('slug', name='uq_categories_slug'),
    )

class Attribute(Base, UUIDMixin):
    __tablename__ = "catalog_attributes"
    
    name = Column(String(255), nullable=False)
    input_type = Column(Enum('text', 'select', 'number', 'boolean', name='attribute_input_type'), nullable=False)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    category_attributes = relationship("CategoryAttribute", back_populates="attribute", cascade="all, delete-orphan")

class CategoryAttribute(Base):
    __tablename__ = "catalog_category_attributes"
    
    category_id = Column(BINARY(16), ForeignKey("catalog_categories.id", ondelete="CASCADE"), primary_key=True)
    attribute_id = Column(BINARY(16), ForeignKey("catalog_attributes.id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    category = relationship("Category", back_populates="category_attributes")
    attribute = relationship("Attribute", back_populates="category_attributes")

class Listing(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "catalog_listings"
    
    shop_id = Column(BINARY(16), ForeignKey("shop_shops.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(BINARY(16), ForeignKey("catalog_categories.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    description = Column(MEDIUMTEXT)
    condition = Column(String(64))
    brand = Column(String(128))
    price = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='VND')
    stock = Column(Integer, nullable=False, default=0)
    sku = Column(String(128))
    status = Column(Enum('draft', 'active', 'paused', 'banned', 'archived', name='listing_status'), nullable=False, default='draft')
    moderation_status = Column(Enum('pending', 'approved', 'rejected', name='moderation_status'), nullable=False, default='pending')
    seo_slug = Column(String(255))
    
    # Relationships
    shop = relationship("Shop", back_populates="listings")
    category = relationship("Category", back_populates="listings")
    variants = relationship("ListingVariant", back_populates="listing", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="listing", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="listing", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('seo_slug', name='uq_listings_seo'),
        CheckConstraint('price >= 0', name='ck_listings_price_positive'),
        CheckConstraint('stock >= 0', name='ck_listings_stock_positive'),
        Index('idx_listings_shop', 'shop_id'),
        Index('idx_listings_category', 'category_id'),
        Index('idx_listings_status', 'status', 'moderation_status'),
        Index('fts_listings_title_desc', 'title', 'description', mysql_prefix='FULLTEXT'),
    )

class ListingVariant(Base, UUIDMixin):
    __tablename__ = "catalog_listing_variants"
    
    listing_id = Column(BINARY(16), ForeignKey("catalog_listings.id", ondelete="CASCADE"), nullable=False)
    variant_sku = Column(String(128))
    attrs = Column(JSON)
    price = Column(Numeric(14, 2))
    stock = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    listing = relationship("Listing", back_populates="variants")
    
    __table_args__ = (
        CheckConstraint('price >= 0', name='ck_variants_price_positive'),
        CheckConstraint('stock >= 0', name='ck_variants_stock_positive'),
        Index('idx_variants_listing', 'listing_id'),
    )

class Media(Base, UUIDMixin):
    __tablename__ = "catalog_media"
    
    listing_id = Column(BINARY(16), ForeignKey("catalog_listings.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(1024), nullable=False)
    mime = Column(String(128))
    width = Column(Integer)
    height = Column(Integer)
    size_bytes = Column(Integer)
    content_hash = Column(String(128))
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    listing = relationship("Listing", back_populates="media")
    
    __table_args__ = (
        Index('idx_media_listing', 'listing_id'),
    )

class PriceHistory(Base, UUIDMixin):
    __tablename__ = "catalog_price_history"
    
    listing_id = Column(BINARY(16), ForeignKey("catalog_listings.id", ondelete="CASCADE"), nullable=False)
    old_price = Column(Numeric(14, 2), nullable=False)
    new_price = Column(Numeric(14, 2), nullable=False)
    changed_at = Column(DateTime(6), nullable=False, default=func.current_timestamp(6))
    
    # Relationships
    listing = relationship("Listing", back_populates="price_history")
    
    __table_args__ = (
        CheckConstraint('old_price >= 0', name='ck_price_history_old_positive'),
        CheckConstraint('new_price >= 0', name='ck_price_history_new_positive'),
        Index('idx_price_history_listing', 'listing_id', 'changed_at'),
    )
