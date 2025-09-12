from sqlalchemy.ext.asyncio import AsyncSession

async def init_db(session: AsyncSession) -> None:
    # Seed initial data here (roles, admin user, etc.)
    pass
