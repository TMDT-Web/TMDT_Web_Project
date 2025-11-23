"""
Order and OrderItem Models - Enhanced for Furniture E-commerce
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.models.base import Base


class OrderStatus(str, enum.Enum):
    """Order status enumeration"""
    PENDING = "pending"                     # Chờ xác nhận
    AWAITING_PAYMENT = "awaiting_payment"   # Chờ thanh toán/cọc
    CONFIRMED = "confirmed"                 # Đã xác nhận (Đã cọc xong)
    PROCESSING = "processing"               # Đang đóng gói/Sản xuất
    SHIPPING = "shipping"                   # Đang giao
    COMPLETED = "completed"                 # Hoàn thành
    CANCELLED = "cancelled"                 # Đã hủy
    REFUNDED = "refunded"                   # Đã hoàn tiền


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration"""
    COD = "cod"                             # Tiền mặt khi nhận hàng
    BANK_TRANSFER = "bank_transfer"         # Chuyển khoản ngân hàng
    MOMO = "momo"                           # Ví Momo
    VNPAY = "vnpay"                         # VNPAY


class Order(Base):
    """Order Model - Enhanced for Furniture business"""
    __tablename__ = "orders"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # --- 1. THÔNG TIN TÀI CHÍNH (QUAN TRỌNG) ---
    subtotal = Column(Float, nullable=False)            # Tổng tiền hàng
    shipping_fee = Column(Float, default=0)             # Phí vận chuyển
    discount_amount = Column(Float, default=0)          # Số tiền được giảm
    total_amount = Column(Float, nullable=False)        # = subtotal + shipping - discount
    
    deposit_amount = Column(Float, default=0)           # Số tiền đã cọc
    remaining_amount = Column(Float, default=0)         # Số tiền cần thu nốt (COD)
    
    payment_method = Column(String, default=PaymentMethod.COD)
    is_paid = Column(Boolean, default=False)            # Đã thanh toán hết chưa?

    # --- 2. THÔNG TIN GIAO HÀNG (SNAPSHOT) ---
    # Lưu cứng thông tin người nhận lúc đặt, không link sang bảng Address
    full_name = Column(String, nullable=False)          # Tên người nhận
    phone_number = Column(String, nullable=False)       # SĐT người nhận
    shipping_address = Column(Text, nullable=False)     # Địa chỉ chi tiết
    note = Column(Text, nullable=True)                  # Ghi chú (VD: Giao giờ hành chính)

    # --- 3. TRẠNG THÁI ---
    status = Column(String, default=OrderStatus.PENDING)
    cancellation_reason = Column(Text, nullable=True)   # Lý do hủy đơn

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, total={self.total_amount}, status='{self.status}')>"


class OrderItem(Base):
    """Order Item Model"""
    __tablename__ = "order_items"
    
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    product_name = Column(String, nullable=False)       # Lưu tên sản phẩm lúc mua
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)   # Giá tại thời điểm mua
    
    variant = Column(String, nullable=True)             # Variant info (Màu Xanh, Gỗ Sồi)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, product='{self.product_name}', quantity={self.quantity})>"
