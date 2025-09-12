from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import health, auth, shop, catalog, order
from app.core.config import settings

app = FastAPI(
    title="C2C Marketplace API",
    version="1.0.0",
    description="API for C2C Marketplace - Consumer to Consumer e-commerce platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React Router dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(shop.router, prefix="/api/v1")
app.include_router(catalog.router, prefix="/api/v1")
app.include_router(order.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "C2C Marketplace API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
