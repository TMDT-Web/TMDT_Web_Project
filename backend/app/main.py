# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core import config
from app.core.database import SessionLocal
from app.users.routes import router as users_router
from app.products.routes import router as products_router
from app.products.routes import category_router, tag_router
from app.cart.routes import router as cart_router
from app.orders.routes import router as orders_router
from app.inventory.routes import router as inventory_router
from app.payments.routes import router as payments_router
from app.rewards.routes import router as rewards_router

# chỉ giữ đúng 3 seeding hàm, KHÔNG import những hàm không tồn tại
from app.users.services import (
    ensure_system_roles,
    ensure_permissions_catalog,
    ensure_permissions_have_names,
)


def get_application() -> FastAPI:
    app = FastAPI(
        title=config.settings.project_name,
        version="1.0.0",
        debug=config.settings.debug,
        openapi_url=f"{config.settings.api_prefix}/openapi.json",
        docs_url=f"{config.settings.api_prefix}/docs",
        redoc_url=f"{config.settings.api_prefix}/redoc",
    )

    # CORS
    if config.settings.cors_allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=config.settings.cors_allow_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.on_event("startup")
    def on_startup():
        db = SessionLocal()
        try:
            # 1) seed 3 role: admin/manager/customer
            ensure_system_roles(db)
            # 2) nếu có bảng permissions thì seed/cập nhật
            ensure_permissions_catalog(db)
            ensure_permissions_have_names(db)
            # KHÔNG gọi attach_permissions_to_system_roles (không tồn tại)
        finally:
            db.close()

    # Routers
    app.include_router(users_router, prefix=config.settings.api_prefix)
    app.include_router(category_router, prefix=config.settings.api_prefix)
    app.include_router(tag_router, prefix=config.settings.api_prefix)
    app.include_router(products_router, prefix=config.settings.api_prefix)
    app.include_router(cart_router, prefix=config.settings.api_prefix)
    app.include_router(orders_router, prefix=config.settings.api_prefix)
    app.include_router(inventory_router, prefix=config.settings.api_prefix)
    app.include_router(payments_router, prefix=config.settings.api_prefix)
    app.include_router(rewards_router, prefix=config.settings.api_prefix)

    app.mount("/static", StaticFiles(directory="static"), name="static")
    return app


app = get_application()
