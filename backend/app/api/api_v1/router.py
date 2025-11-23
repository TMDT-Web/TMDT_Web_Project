"""
API v1 Router - Aggregate all endpoint routers
"""
from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth, users, products, orders, payments, chat, upload, addresses,
    collections, cart, dashboard, banners
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(collections.router, prefix="/collections", tags=["Collections"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(banners.router, prefix="/banners", tags=["Banners"])
