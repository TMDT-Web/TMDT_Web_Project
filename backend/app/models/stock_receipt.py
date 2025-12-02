"""
Stock Receipt Models - Phiếu nhập hàng
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class StockReceiptStatus(str, enum.Enum):
    """Stock receipt status"""
    DRAFT = "draft"  # Nháp
    CONFIRMED = "confirmed"  # Đã xác nhận
    COMPLETED = "completed"  # Hoàn thành
    CANCELLED = "cancelled"  # Đã hủy


class StockReceipt(Base):
    """Stock Receipt - Phiếu nhập hàng"""
    __tablename__ = "stock_receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_code = Column(String(50), unique=True, index=True, nullable=False)  # Mã phiếu nhập
    supplier_name = Column(String(255), nullable=False)  # Nhà cung cấp
    supplier_phone = Column(String(20))
    supplier_address = Column(Text)
    
    total_amount = Column(Numeric(10, 2), default=0)  # Tổng tiền
    notes = Column(Text)  # Ghi chú
    
    status = Column(SQLEnum(StockReceiptStatus), default=StockReceiptStatus.DRAFT, nullable=False)
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Người tạo
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime)  # Thời gian xác nhận
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("StockReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class StockReceiptItem(Base):
    """Stock Receipt Item - Chi tiết phiếu nhập"""
    __tablename__ = "stock_receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("stock_receipts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)  # Số lượng nhập
    unit_price = Column(Numeric(10, 2), nullable=False)  # Giá nhập/đơn vị
    subtotal = Column(Numeric(10, 2), nullable=False)  # Thành tiền = quantity * unit_price
    
    notes = Column(Text)  # Ghi chú sản phẩm
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    receipt = relationship("StockReceipt", back_populates="items")
    product = relationship("Product")
