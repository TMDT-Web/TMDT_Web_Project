"""
Database Enums
"""
import enum


class VipTier(str, enum.Enum):
    """VIP membership tiers for loyalty program"""
    MEMBER = "member"      # Khách thường (0-999 điểm)
    SILVER = "silver"      # Khách bạc (1000-4999 điểm)
    GOLD = "gold"          # Khách vàng (5000-9999 điểm)
    DIAMOND = "diamond"    # Khách kim cương (10000+ điểm)


class UserRole(str, enum.Enum):
    """User roles for access control"""
    CUSTOMER = "customer"  # Khách hàng
    STAFF = "staff"        # Nhân viên
    ADMIN = "admin"        # Quản trị viên
