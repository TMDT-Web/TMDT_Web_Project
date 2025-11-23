"""
Authentication Service
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token
)
from app.core.exceptions import UnauthorizedException, ConflictException


class AuthService:
    """Authentication service"""
    
    @staticmethod
    def register(db: Session, data: RegisterRequest) -> User:
        """Register a new user"""
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user:
            raise ConflictException("Email already registered")
        
        # Create new user
        hashed_password = get_password_hash(data.password)
        user = User(
            email=data.email,
            hashed_password=hashed_password,
            full_name=data.full_name,
            phone=data.phone,
            is_active=True,
            is_verified=False
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def login(db: Session, data: LoginRequest) -> Token:
        """Login user and return JWT tokens"""
        # Find user by email
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise UnauthorizedException("Invalid email or password")
        
        # Verify password
        if not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("Account is inactive")
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "is_admin": user.is_admin
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    
    @staticmethod
    def get_current_user(db: Session, user_id: int) -> Optional[User]:
        """Get current user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token
        
        Args:
            db: Database session
            refresh_token: Valid refresh token
        
        Returns:
            New access token and refresh token
        
        Raises:
            UnauthorizedException: If token is invalid or expired
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload:
            raise UnauthorizedException("Invalid refresh token")
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")
        
        # Get user from token
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")
        
        # Find user
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise UnauthorizedException("User not found")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("Account is inactive")
        
        # Create new tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "is_admin": user.is_admin
        }
        
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )
