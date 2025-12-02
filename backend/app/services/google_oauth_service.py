"""
Google OAuth Service
"""
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import secrets
import uuid
from typing import Dict, Optional
import logging
from redis import Redis

from app.core.config import settings
from app.models.user import User
from app.models.notification import UserNotificationPreference
from app.services.auth_service import AuthService
from app.core.security import get_password_hash
from app.schemas.auth import Token


class GoogleOAuthService:
    """Service for Google OAuth operations"""

    # In-memory fallback store (for dev only if Redis unavailable)
    _state_store: Dict[str, str] = {}
    _redis_client: Optional[Redis] = None

    @classmethod
    def _get_redis(cls) -> Optional[Redis]:
        if cls._redis_client:
            return cls._redis_client
        try:
            cls._redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Simple ping test
            cls._redis_client.ping()
            return cls._redis_client
        except Exception:
            logging.warning("[GoogleOAuthService] Redis not available, falling back to in-memory state store")
            cls._redis_client = None
            return None

    @classmethod
    def _store_state(cls, state: str) -> None:
        redis = cls._get_redis()
        value = str(uuid.uuid4())
        if redis:
            # Expire after 5 minutes
            redis.setex(f"oauth_state:{state}", 300, value)
        else:
            cls._state_store[state] = value

    @classmethod
    def _has_state(cls, state: str) -> bool:
        redis = cls._get_redis()
        if redis:
            return redis.exists(f"oauth_state:{state}") == 1
        return state in cls._state_store

    @classmethod
    def _consume_state(cls, state: str) -> None:
        redis = cls._get_redis()
        if redis:
            redis.delete(f"oauth_state:{state}")
        else:
            cls._state_store.pop(state, None)
    
    @classmethod
    def generate_auth_url(cls) -> tuple[str, str]:
        """
        Generate Google OAuth authorization URL
        
        Returns:
            Tuple of (auth_url, state)
        """
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )
        
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        cls._store_state(state)
        
        # Build authorization URL
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        return auth_url, state
    
    @classmethod
    def verify_state(cls, state: str) -> bool:
        """Verify CSRF state token"""
        return cls._has_state(state)
    
    @classmethod
    def consume_state(cls, state: str) -> None:
        """Remove state after use"""
        cls._consume_state(state)
    
    @classmethod
    async def verify_google_token(cls, token: str) -> Dict:
        """
        Verify Google ID token and extract user info
        
        Args:
            token: Google ID token
            
        Returns:
            User info dict with keys: sub, email, email_verified, name, picture
        """
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            # Verify issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return idinfo
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
    
    @classmethod
    def get_or_create_user(
        cls,
        db: Session,
        google_id: str,
        email: str,
        email_verified: bool,
        full_name: str,
        avatar_url: Optional[str] = None
    ) -> User:
        """
        Get existing user by google_id or email, or create new user
        
        Args:
            db: Database session
            google_id: Google user ID (sub claim)
            email: User email
            email_verified: Whether email is verified by Google
            full_name: User's full name
            avatar_url: User's profile picture URL
            
        Returns:
            User object
        """
        # Try to find by google_id first
        user = db.query(User).filter(User.google_id == google_id).first()
        if user:
            # Update info if changed
            if user.full_name != full_name:
                user.full_name = full_name
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
            if not user.email_verified and email_verified:
                user.email_verified = email_verified
            db.commit()
            db.refresh(user)
            return user
        
        # Try to find by email (link existing account)
        if email_verified:  # Only link if email is verified
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Link Google account
                user.google_id = google_id
                user.email_verified = True
                if not user.avatar_url and avatar_url:
                    user.avatar_url = avatar_url
                db.commit()
                db.refresh(user)
                return user
        
        # Create new user
        # Generate a random password (user won't use it for Google login)
        random_password = secrets.token_urlsafe(32)
        # Use security helper to hash the random password (AuthService has no hash_password method)
        hashed_password = get_password_hash(random_password)
        
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            google_id=google_id,
            email_verified=email_verified,
            avatar_url=avatar_url,
            is_verified=email_verified,  # Auto-verify if Google verified
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create default notification preferences
        prefs = UserNotificationPreference(
            user_id=user.id,
            email_enabled=True,
            sms_enabled=False,
            push_enabled=False,
            order_updates=True,
            promotions=True
        )
        db.add(prefs)
        db.commit()
        
        return user
    
    @classmethod
    def issue_jwt_for_user(cls, db: Session, user: User) -> Token:
        """
        Issue JWT tokens for authenticated user
        
        Args:
            db: Database session
            user: Authenticated user
            
        Returns:
            Token response with access and refresh tokens
        """
        # Use existing AuthService to create tokens
        from app.core.security import create_access_token, create_refresh_token
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
