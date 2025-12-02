from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth, users, products, orders, payments,
    chat, chatbot, upload, addresses, collections,
    cart, dashboard, banners,
    users_admin, addresses_admin, contact, notifications,
    stock_receipts, coupons
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# ADMIN routes first (more specific paths must be registered before less specific ones)
api_router.include_router(users_admin.router, prefix="/users/admin", tags=["Users Admin"])
api_router.include_router(addresses_admin.router, prefix="/addresses/admin", tags=["Addresses Admin"])

# Regular user routes
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(collections.router, prefix="/collections", tags=["Collections"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(banners.router, prefix="/banners", tags=["Banners"])
api_router.include_router(contact.router, prefix="/contact", tags=["Contact"])
api_router.include_router(stock_receipts.router, prefix="/stock-receipts", tags=["Stock Receipts"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["Coupons"])
