from fastapi import FastAPI
from app.api.v1.routers.health import router as health_router

app = FastAPI(title="C2C Marketplace API", version="1.0.0")

# Mount API v1 routers
app.include_router(health_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
