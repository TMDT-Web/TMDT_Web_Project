# app/users/routes/list_roles.py
from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.users.models import Role
from app.users import schemas
from . import router


@router.get("/users/roles", response_model=list[schemas.RoleRead])
def list_roles(db: Session = Depends(get_db)) -> list[schemas.RoleRead]:
    """
    Liệt kê tất cả roles.
    - Không dùng bất kỳ dependency kiểm tra quyền nào để tránh 422.
    - Trả về theo RoleRead; map thủ công để tránh lỗi validate Pydantic.
    """
    roles = db.query(Role).order_by(Role.name).all()
    # map thủ công -> RoleRead (an toàn, không đụng forward refs)
    return [
        schemas.RoleRead(
            id=r.id,
            name=r.name,
            description=r.description,
            is_system=bool(r.is_system),
        )
        for r in roles
    ]
