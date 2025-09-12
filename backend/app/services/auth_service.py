from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.identity import User, UserProfile
from app.schemas.auth import UserCreate, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from datetime import timedelta

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, user_data: UserCreate) -> UserResponse:
        # Check if user already exists
        result = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=hashed_password,
            status="active"
        )
        
        self.db.add(user)
        await self.db.flush()  # Get the user ID
        
        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            full_name=user_data.full_name
        )
        self.db.add(profile)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return UserResponse.model_validate(user)

    async def authenticate_user(self, email: str, password: str) -> Token:
        # Get user by email
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def get_current_user(self, token: str) -> UserResponse:
        from app.core.security import verify_token
        
        user_id = verify_token(token)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return UserResponse.model_validate(user)

    async def refresh_token(self, token: str) -> Token:
        # For now, just return a new token with same user
        user_response = await self.get_current_user(token)
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user_response.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
