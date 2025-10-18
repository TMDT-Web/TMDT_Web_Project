from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core import config
from app.core.database import create_database
from app.users.routes import router as users_router
from app.products.routes import router as products_router
from app.cart.routes import router as cart_router
from app.orders.routes import router as orders_router
from app.inventory.routes import router as inventory_router
from app.payments.routes import router as payments_router
from app.rewards.routes import router as rewards_router


def get_application() -> FastAPI:
    app = FastAPI(
        title=config.settings.project_name,
        version="1.0.0",
        debug=config.settings.debug,
        openapi_url=f"{config.settings.api_prefix}/openapi.json",
        docs_url=f"{config.settings.api_prefix}/docs",
        redoc_url=f"{config.settings.api_prefix}/redoc",
    )

    if config.settings.cors_allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=config.settings.cors_allow_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.add_event_handler("startup", create_database)

    app.include_router(users_router, prefix=config.settings.api_prefix)
    app.include_router(products_router, prefix=config.settings.api_prefix)
    app.include_router(cart_router, prefix=config.settings.api_prefix)
    app.include_router(orders_router, prefix=config.settings.api_prefix)
    app.include_router(inventory_router, prefix=config.settings.api_prefix)
    app.include_router(payments_router, prefix=config.settings.api_prefix)
    app.include_router(rewards_router, prefix=config.settings.api_prefix)

    app.mount("/static", StaticFiles(directory="static"), name="static")

    return app


app = get_application()
