from fastapi import APIRouter

router = APIRouter(tags=["Users", "Auth"])

from . import (
    register_user,
    login,
    refresh_token,
    google_oauth_login,
    google_oauth_callback,
    read_current_user,
    list_users,
    get_user_detail,
    update_user,
    create_role,
    list_roles,
    create_address,
)  # noqa: E402,F401

__all__ = ["router"]
