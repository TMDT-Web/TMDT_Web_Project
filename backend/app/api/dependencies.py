from typing import AsyncGenerator
from app.db.session import async_session
from app.core.security import get_current_user, get_current_active_user, get_current_admin_user
from app.models.identity import User

async def get_db() -> AsyncGenerator:
    async with async_session() as session:
        yield session

# Re-export security dependencies for easy import
get_current_user = get_current_user
get_current_active_user = get_current_active_user
get_current_admin_user = get_current_admin_user
