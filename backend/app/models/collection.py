"""
Collection and CollectionItem Models
Supports Product Bundles/Combos
"""
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class CollectionItem(Base):
    """
    Association model for Collection <-> Product with quantity support
    Enables bundle logic: e.g., "1 Table + 6 Chairs"
    """
    __tablename__ = "collection_items"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)  # How many of this product in the bundle

    # Relationships
    collection = relationship("Collection", back_populates="items")
    product = relationship("Product")


class Collection(Base):
    """
    Collection/Bundle Model
    Now supports selling multiple products together at a special price
    """
    __tablename__ = "collections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True)
    banner_url = Column(String, nullable=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # New field for bundle pricing
    sale_price = Column(Float, nullable=True)  # The special combo price set by admin
    
    # Relationships
    items = relationship("CollectionItem", back_populates="collection", cascade="all, delete-orphan")
    
    # Keep backward compatibility: products still have collection_id
    products = relationship("Product", back_populates="collection")
    
    @property
    def total_original_price(self) -> float:
        """
        Calculate the total price of all items in the bundle at their regular prices
        Sum of (Product.price * CollectionItem.quantity)
        """
        total = 0.0
        for item in self.items:
            if item.product and item.product.price:
                total += item.product.price * item.quantity
        return total
    
    @property
    def discount_amount(self) -> float:
        """Calculate the discount amount if sale_price is set"""
        if self.sale_price and self.total_original_price > 0:
            return self.total_original_price - self.sale_price
        return 0.0
    
    @property
    def discount_percentage(self) -> float:
        """Calculate the discount percentage if sale_price is set"""
        if self.sale_price and self.total_original_price > 0:
            return (self.discount_amount / self.total_original_price) * 100
        return 0.0
