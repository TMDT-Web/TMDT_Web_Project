from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks (connect DB, warm caches, etc.)
    yield
    # Shutdown tasks (close DB, flush caches, etc.)
