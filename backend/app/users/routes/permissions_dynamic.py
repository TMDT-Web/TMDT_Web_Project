# app/users/routes/permissions_dynamic.py
from typing import List
from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

# DÙNG CHUNG router chia sẻ thay vì tạo APIRouter mới
from . import router

from app.users import models, schemas, services
from app.core.database import get_db
# Nếu muốn chỉ Admin mới gọi được các API này, bạn có thể bật AdminOnly
# from app.users.dependencies import AdminOnly

# ----------------- Helpers -----------------
def _role_or_404(db: Session, role_id: int) -> models.Role:
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

def _permissions_by_ids(db: Session, ids: List[int]) -> List[models.Permission]:
    if not ids:
        return []
    return (
        db.query(models.Permission)
        .filter(models.Permission.id.in_(list(set(ids))))
        .all()
    )

def _get_role_permission_ids(db: Session, role_id: int) -> List[int]:
    q = (
        db.query(models.RolePermission.permission_id)
        .filter(models.RolePermission.role_id == role_id)
    )
    return [pid for (pid,) in q.all()]

# ------------- Role ↔ Permissions -------------

@router.get(
    "/roles/{role_id}/permissions",
    response_model=schemas.RolePermissionsRead,
    # dependencies=[Depends(AdminOnly)],
)
def get_role_permissions(role_id: int, db: Session = Depends(get_db)):
    _role_or_404(db, role_id)
    ids = _get_role_permission_ids(db, role_id)
    return schemas.RolePermissionsRead(role_id=role_id, permission_ids=ids)

@router.put(
    "/roles/{role_id}/permissions",
    response_model=schemas.RolePermissionsRead,
    status_code=status.HTTP_200_OK,
    # dependencies=[Depends(AdminOnly)],
)
def put_role_permissions(
    role_id: int,
    payload: schemas.RolePermissionsUpdate,
    db: Session = Depends(get_db),
):
    role = _role_or_404(db, role_id)

    incoming_ids: List[int] = list(dict.fromkeys(payload.permission_ids or []))
    existing = _permissions_by_ids(db, incoming_ids)
    existing_ids = {p.id for p in existing}

    db.query(models.RolePermission).filter(
        models.RolePermission.role_id == role.id
    ).delete(synchronize_session=False)

    db.add_all(
        [models.RolePermission(role_id=role.id, permission_id=pid) for pid in existing_ids]
    )
    db.commit()

    return schemas.RolePermissionsRead(
        role_id=role.id,
        permission_ids=sorted(existing_ids),
    )

# ------------- User ↔ Permissions (override trực tiếp) -------------

@router.get(
    "/users/{user_id}/permissions",
    response_model=schemas.UserPermissionIds,
    status_code=status.HTTP_200_OK,
)
def get_permissions_of_user(
    user_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    # _=Depends(AdminOnly),
):
    ids = services.get_user_permission_ids(db, user_id)
    return {"permission_ids": ids}

@router.put(
    "/users/{user_id}/permissions",
    response_model=schemas.UserPermissionIds,
    status_code=status.HTTP_200_OK,
)
def update_permissions_of_user(
    payload: schemas.UserPermissionIds,
    user_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    # _=Depends(AdminOnly),
):
    services.set_user_permission_ids(db, user_id, payload.permission_ids)
    new_ids = services.get_user_permission_ids(db, user_id)
    return {"permission_ids": new_ids}
