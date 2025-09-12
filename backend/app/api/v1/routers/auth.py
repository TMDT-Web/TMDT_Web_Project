from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService
from app.core.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(async_session)):
    """Register a new user"""
    auth_service = AuthService(db)
    return await auth_service.register_user(user_data)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(async_session)):
    """Login user and return access token"""
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(form_data.username, form_data.password)

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(async_session)):
    """Get current user information"""
    auth_service = AuthService(db)
    return await auth_service.get_current_user(token)

@router.post("/refresh", response_model=Token)
async def refresh_token(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(async_session)):
    """Refresh access token"""
    auth_service = AuthService(db)
    return await auth_service.refresh_token(token)
