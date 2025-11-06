from __future__ import annotations

from fastapi import Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users import schemas, services

from . import router


@router.get("/auth/google/callback")
async def google_oauth_callback(code: str, db: Session = Depends(get_db)):
    """
    Google OAuth callback endpoint.
    Redirects to frontend with tokens in URL hash.
    """
    user, created = await services.exchange_google_code(db, code)
    token_pair = services.issue_token_pair(user)
    
    # Redirect to frontend with tokens in URL hash
    frontend_url = "http://localhost:5173"
    redirect_url = (
        f"{frontend_url}/auth/callback"
        f"#access_token={token_pair.access_token}"
        f"&refresh_token={token_pair.refresh_token}"
        f"&token_type=bearer"
        f"&is_new_user={str(created).lower()}"
    )
    
    return RedirectResponse(url=redirect_url)
