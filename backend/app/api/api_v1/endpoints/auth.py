"""
Authentication Endpoints
"""
from fastapi import APIRouter, Depends, status, Header, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import RegisterRequest, Token, LoginRequest, RefreshTokenRequest
from app.schemas.user import UserResponse
from app.schemas.google_auth import GoogleAuthURL
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    user = AuthService.register(db, data)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    login_data = LoginRequest(email=form_data.username, password=form_data.password)
    token = AuthService.login(db, login_data)
    return token


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.post("/logout")
def logout():
    """Logout (client-side token deletion)"""
    return {"message": "Successfully logged out"}


@router.post("/refresh-token", response_model=Token)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    Provide the refresh_token to get a new access_token and refresh_token.
    """
    token = AuthService.refresh_access_token(db, data.refresh_token)
    return token


@router.get("/google/login", response_model=GoogleAuthURL)
def google_login():
    """
    Initiate Google OAuth login flow
    
    Returns the Google authorization URL and state for CSRF protection.
    Frontend should redirect user to this URL.
    """
    auth_url, state = GoogleOAuthService.generate_auth_url()
    return GoogleAuthURL(auth_url=auth_url, state=state)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="CSRF state token"),
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback
    
    Exchanges authorization code for tokens, verifies user, and issues JWT.
    Redirects to frontend with tokens.
    """
    # Verify state (skip in development if needed)
    if settings.ENVIRONMENT == "production":
        if not GoogleOAuthService.verify_state(state):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter"
            )
        GoogleOAuthService.consume_state(state)
    else:
        # Development: log but don't fail
        if not GoogleOAuthService.verify_state(state):
            import logging
            logging.warning(f"[OAuth] Invalid/expired state in development mode: {state[:10]}...")
        else:
            GoogleOAuthService.consume_state(state)
    
    # Exchange code for tokens
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            token_response.raise_for_status()
            tokens = token_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange code for tokens: {str(e)}"
        )
    
    # Verify ID token and extract user info
    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ID token received"
        )
    
    user_info = await GoogleOAuthService.verify_google_token(id_token)
    
    # Get or create user
    user = GoogleOAuthService.get_or_create_user(
        db=db,
        google_id=user_info["sub"],
        email=user_info["email"],
        email_verified=user_info.get("email_verified", False),
        full_name=user_info.get("name", user_info["email"]),
        avatar_url=user_info.get("picture")
    )
    
    # Issue JWT
    jwt_token = GoogleOAuthService.issue_jwt_for_user(db, user)
    
    # Redirect to frontend with token
    redirect_url = f"{settings.FRONTEND_BASE_URL}/auth/google/callback?access_token={jwt_token.access_token}&refresh_token={jwt_token.refresh_token}"
    return RedirectResponse(url=redirect_url)
