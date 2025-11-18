# backend/app/users/routes/list_permissions_of_me.py
from typing import List, Set

from fastapi import Depends
from app.users.models import User
from app.users import dependencies as deps
from . import router

# Mapping đơn giản: bạn có thể thay bằng DB/Policy engine bất kỳ.
ROLE_PERMISSIONS = {
    "root": {
        "users.read", "users.update", "users.activate",
        "roles.read", "roles.assign",
        "products.read", "products.write",
        "orders.read", "orders.manage",
    },
    "admin": {
        "users.read", "users.update", "users.activate",
        "roles.read", "roles.assign",
        "products.read", "products.write",
        "orders.read", "orders.manage",
    },
    "manager": {
        "users.read",
        "products.read", "products.write",
        "orders.read", "orders.manage",
    },
    "staff": {
        "products.read",
        "orders.read",
    },
    "customer": {
        "products.read",
        "orders.read",
    },
}

@router.get("/users/me/permissions", response_model=list[str])
def list_my_permissions(current_user: User = Depends(deps.get_current_active_user)) -> list[str]:
    perms: Set[str] = set()
    for r in current_user.roles or []:
        perms |= ROLE_PERMISSIONS.get(r.name, set())
    # có thể cộng thêm feature flags, org policies, v.v ở đây
    return sorted(perms)
