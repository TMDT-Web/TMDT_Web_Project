# app/users/services.py
from __future__ import annotations
from typing import Iterable, Optional, List, Sequence, Dict
from secrets import token_urlsafe

from sqlalchemy import select, inspect, text, Table, MetaData
from sqlalchemy.orm import Session

from app.users.models import User, Role, Permission
from app.users.schemas import UserCreate, UserRead, RoleRead

# ---- Compat with app.core.security (JWT) or fallback (dev tokens) ----
try:
    # Nếu bạn đã có module này, dùng luôn cho đúng logic cũ
    from app.core.security import (
        get_password_hash,
        verify_password,
        create_access_token,
        create_refresh_token,
    )
    _SEC_MODE = "core"
except Exception:
    # Fallback an toàn để server không sập nếu thiếu core.security
    from passlib.hash import argon2

    def get_password_hash(raw: str) -> str:
        return argon2.hash(raw)

    def verify_password(raw: str, hashed: str) -> bool:
        try:
            return argon2.verify(raw, hashed)
        except Exception:
            return False

    def create_access_token(user_id: int) -> str:
        return token_urlsafe(32)

    def create_refresh_token(user_id: int) -> str:
        return token_urlsafe(32)

    _SEC_MODE = "fallback"

# =========================
# Permission catalog (idempotent)
# =========================
_PERMISSION_CATALOG = [
    ("admin.dashboard.view",        "Xem Dashboard quản trị"),
    ("admin.users.read",            "Xem danh sách người dùng"),
    ("admin.users.update",          "Cập nhật người dùng"),
    ("admin.roles.read",            "Xem vai trò"),
    ("admin.roles.update",          "Cập nhật vai trò người dùng"),
    ("admin.permissions.override",  "Ghi đè quyền người dùng"),
]

# =========================
# Role helpers
# =========================
def _get_role_by_name(db: Session, name: str) -> Optional[Role]:
    name = (name or "").strip().lower()
    return db.execute(select(Role).where(Role.name == name)).scalar_one_or_none()

def _ensure_role(db: Session, name: str, description: str) -> Role:
    r = _get_role_by_name(db, name)
    if r:
        return r
    r = Role(name=name, description=description, is_system=True)
    db.add(r)
    db.flush()
    return r

def ensure_system_roles(db: Session) -> None:
    _ensure_role(db, "admin", "System administrator")
    _ensure_role(db, "manager", "Business manager")
    _ensure_role(db, "customer", "Customer")
    db.commit()

# =========================
# Permissions seeding / repair (idempotent, no-op if tables missing)
# =========================
def ensure_permissions_catalog(db: Session) -> None:
    engine = db.get_bind()
    insp = inspect(engine)
    if not insp.has_table("permissions"):
        return

    existing_codes = {code for (code,) in db.query(Permission.code).all()}
    created = False
    for code, name in _PERMISSION_CATALOG:
        if code not in existing_codes:
            db.add(Permission(code=code, name=name, is_system=True))
            created = True
    if created:
        db.commit()

def ensure_permissions_have_names(db: Session) -> None:
    engine = db.get_bind()
    insp = inspect(engine)
    if not insp.has_table("permissions"):
        return

    name_map = {code: name for code, name in _PERMISSION_CATALOG}
    updated = False
    perms = db.query(Permission).filter(
        (Permission.name.is_(None)) | (Permission.name == "")
    ).all()
    for p in perms:
        if p.code in name_map:
            p.name = name_map[p.code]
            updated = True
    if updated:
        db.commit()

def attach_permissions_to_system_roles(db: Session) -> None:
    engine = db.get_bind()
    insp = inspect(engine)
    for tbl in ("roles", "permissions", "role_permissions"):
        if not insp.has_table(tbl):
            return

    role_admin = db.query(Role).filter(Role.name == "admin").first()
    role_manager = db.query(Role).filter(Role.name == "manager").first()
    if not role_admin and not role_manager:
        return

    admin_codes = [code for code, _ in _PERMISSION_CATALOG]
    manager_codes = ["admin.dashboard.view", "admin.users.read", "admin.roles.read"]

    perm_rows = db.query(Permission.id, Permission.code).all()
    code_to_id = {code: pid for (pid, code) in perm_rows}

    def _attach(role_id: int, codes: list[str]) -> None:
        for c in codes:
            pid = code_to_id.get(c)
            if not pid:
                continue
            db.execute(
                text("""
                    INSERT INTO role_permissions(role_id, permission_id)
                    VALUES (:rid, :pid)
                    ON CONFLICT ON CONSTRAINT uq_role_permissions_role_perm DO NOTHING
                """),
                {"rid": role_id, "pid": pid},
            )

    if role_admin:
        _attach(role_admin.id, admin_codes)
    if role_manager:
        _attach(role_manager.id, manager_codes)
    db.commit()

# =========================
# Users
# =========================
def create_user(
    db: Session,
    payload: UserCreate,
    default_roles: Optional[Iterable[str]] = None,
) -> User:
    email = payload.email.strip().lower()
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise ValueError("Email đã tồn tại")

    user = User(
        email=email,
        password_hash=get_password_hash(payload.password) if payload.password else None,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        is_active=True,
    )
    db.add(user)
    db.flush()

    for rn in list(default_roles or ["customer"]):
        r = _get_role_by_name(db, rn)
        if r:
            user.roles.append(r)  # type: ignore[attr-defined]

    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.execute(
        select(User).where(User.email == (email or "").strip().lower())
    ).scalar_one_or_none()
    if not user or not user.password_hash:
        raise ValueError("Sai email hoặc mật khẩu")
    if not verify_password(password, user.password_hash):
        raise ValueError("Sai email hoặc mật khẩu")
    if not user.is_active:
        raise ValueError("Tài khoản đang bị khóa")
    return user

# =========================
# Token
# =========================
def issue_token_pair(user: User) -> dict:
    """
    Nếu có app.core.security -> phát hành JWT (access + refresh).
    Nếu không, fallback token ngẫu nhiên để không chặn luồng dev.
    """
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
    }

# =========================
# Permissions compute (works even if some tables are missing)
# =========================
def compute_user_permission_map(db: Session, user: User) -> Dict[str, dict]:
    engine = db.get_bind()
    insp = inspect(engine)
    existing = set(insp.get_table_names())
    if "permissions" not in existing:
        return {}

    # reflect only what exists
    meta = MetaData()
    meta.reflect(bind=engine, only=[t for t in ["permissions", "role_permissions", "user_permissions"] if t in existing])
    perm_tbl: Table = meta.tables["permissions"]

    result: Dict[str, dict] = {c: {"allowed": False, "source": "role"} for (c,) in db.execute(select(perm_tbl.c.code)).fetchall()}

    if "role_permissions" in meta.tables:
        rp = meta.tables["role_permissions"]
        rows = db.execute(
            text("""
                SELECT p.code
                FROM role_permissions rp
                JOIN permissions p ON p.id = rp.permission_id
                WHERE rp.role_id = ANY(:rids)
            """),
            {"rids": [r.id for r in (user.roles or [])]},  # type: ignore[attr-defined]
        ).fetchall()
        for (code,) in rows:
            if code in result:
                result[code] = {"allowed": True, "source": "role"}

    if "user_permissions" in meta.tables:
        rows = db.execute(
            text("""
                SELECT p.code
                FROM user_permissions up
                JOIN permissions p ON p.id = up.permission_id
                WHERE up.user_id = :uid
            """),
            {"uid": user.id},
        ).fetchall()
        for (code,) in rows:
            result[code] = {"allowed": True, "source": "override-allow"}

    return result

# =========================
# User ↔ Permissions (helpers cho phân quyền động theo user)
# =========================
def get_user_permissions(db: Session, user_id: int) -> List[Permission]:
    """
    Trả về list Permission của user (ghép theo quan hệ many-to-many user.permissions).
    Nếu không tồn tại user => trả list rỗng.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    return list(user.permissions or [])  # type: ignore[attr-defined]

def get_user_permission_ids(db: Session, user_id: int) -> List[int]:
    """
    Trả về danh sách permission_id đang gán trực tiếp cho user.
    (Không tính quyền từ role; nếu bạn muốn tính cả role thì gọi compute_user_permission_map)
    """
    return [p.id for p in get_user_permissions(db, user_id)]

def set_user_permission_ids(db: Session, user_id: int, permission_ids: List[int]) -> None:
    """
    Ghi đè (replace) danh sách permission trực tiếp của user = permission_ids.
    Yêu cầu: model User có quan hệ many-to-many `permissions`.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    target_perms = (
        db.query(Permission)
        .filter(Permission.id.in_(permission_ids or []))
        .all()
    )
    user.permissions = target_perms  # type: ignore[attr-defined]
    db.add(user)
    db.commit()

# =========================
# Mappers
# =========================
def to_user_read(user: User) -> UserRead:
    roles = [RoleRead.model_validate(r) for r in (user.roles or [])]  # type: ignore[attr-defined]
    return UserRead.model_validate(
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "is_active": user.is_active,
            "roles": roles,
        }
    )
