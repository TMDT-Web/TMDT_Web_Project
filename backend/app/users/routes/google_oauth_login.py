from __future__ import annotations

from fastapi import HTTPException

from starlette.responses import RedirectResponse

from app.core import config

from . import router


@router.get("/auth/google/login", response_class=RedirectResponse, status_code=307, name="auth:google-login")
def google_oauth_login() -> RedirectResponse:
    """
    Generate Google OAuth2 URL and redirect the user.
    """
    if not all([config.settings.google_client_id, config.settings.google_redirect_uri]):
        raise HTTPException(status_code=500, detail="Google OAuth2 is not configured")

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"scope=openid%20email%20profile&"
        f"response_type=code&"
        f"redirect_uri={config.settings.google_redirect_uri}&"
        f"client_id={config.settings.google_client_id}"
    )
    return RedirectResponse(url=auth_url)
