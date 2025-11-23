from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# 1. DANH MỤC (Category) - VD: Sofa, Bàn ăn, Đèn
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True) # URL thân thiện: /danh-muc/sofa
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True) # Ảnh đại diện danh mục
    
    # Parent Category (Đệ quy: Phòng khách -> Sofa)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    products = relationship("Product", back_populates="category")
    children = relationship("Category", remote_side=[id]) # Sub-categories

# 2. BỘ SƯU TẬP (Collection) - VD: Autumn 2025, Minimalist
class Collection(Base):
    __tablename__ = "collections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True)
    banner_url = Column(String, nullable=True) # Ảnh bìa bộ sưu tập to đẹp
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="collection")

# 3. SẢN PHẨM CHÍNH (Product)
class Product(Base):
    __tablename__ = "products"

    # --- Định danh cơ bản ---
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True) # Mã kho (VD: SOFA-001-XAM)
    slug = Column(String, unique=True, index=True)
    
    # --- Thông tin bán hàng ---
    price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=True) # Giá khuyến mãi (nếu có)
    stock = Column(Integer, default=0) # Tồn kho
    is_active = Column(Boolean, default=True) # Còn bán hay không
    is_featured = Column(Boolean, default=False) # Sản phẩm nổi bật (hiện trang chủ)

    # --- Mô tả & Media ---
    description = Column(Text) # Mô tả HTML dài
    short_description = Column(String(500)) # Mô tả ngắn cho thẻ sản phẩm
    thumbnail_url = Column(String) # Ảnh đại diện
    images = Column(JSON, default=[]) # List các URL ảnh phụ: ["img1.jpg", "img2.jpg"]
    
    # --- Social Features ---
    likes = Column(ARRAY(Integer), default=list) # List of user IDs who liked this product

    # --- ĐẶC THÙ NỘI THẤT (Technical Specs) ---
    # Lưu kích thước: {"length": 200, "width": 80, "height": 75, "unit": "cm"}
    dimensions = Column(JSON, nullable=True) 
    
    # Lưu chất liệu/màu sắc: {"material": "Da bò Ý", "color": "Nâu", "color_hex": "#8B4513"}
    specs = Column(JSON, nullable=True)
    
    weight = Column(Float, nullable=True) # Đơn vị kg (để tính ship)

    # --- Phân loại ---
    category_id = Column(Integer, ForeignKey("categories.id"))
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)

    # --- Quan hệ ---
    category = relationship("Category", back_populates="products")
    collection = relationship("Collection", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
