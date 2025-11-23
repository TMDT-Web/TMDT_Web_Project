"""
Test helper utilities
"""
from typing import Dict, Any
from datetime import datetime, timedelta
from app.core.security import create_access_token


def create_test_token(user_id: int, email: str, is_admin: bool = False) -> str:
    """Create a test JWT token"""
    data = {
        "sub": str(user_id),
        "email": email,
        "is_admin": is_admin,
    }
    return create_access_token(data)


def create_test_user_data(
    email: str = "test@example.com",
    password: str = "Test@123456",
    full_name: str = "Test User"
) -> Dict[str, Any]:
    """Create test user data"""
    return {
        "email": email,
        "password": password,
        "full_name": full_name
    }


def create_test_product_data(
    name: str = "Test Product",
    price: float = 1000000,
    category_id: int = 1
) -> Dict[str, Any]:
    """Create test product data"""
    return {
        "name": name,
        "description": "Test product description",
        "price": price,
        "category_id": category_id,
        "stock": 100,
        "is_active": True
    }
