from sqlalchemy.orm import Session
from app.users.models import Role, Permission  # Permission là model mới
from sqlalchemy import select

# danh sách code => (name, description)
DEFAULT_PERMS: dict[str, tuple[str, str | None]] = {
    # Sản phẩm
    "product:create": ("Tạo sản phẩm", None),
    "product:update": ("Sửa sản phẩm", None),
    "product:delete": ("Xoá sản phẩm", None),
    "product:view":   ("Xem sản phẩm", None),
    # Danh mục
    "category:manage": ("Quản lý danh mục", None),
    # Đơn hàng
    "order:view": ("Xem đơn hàng", None),
    "order:update_status": ("Cập nhật trạng thái đơn", None),
    # Người dùng (chỉ root)
    "user:assign_roles": ("Gán vai trò", None),
}

# gán mặc định cho role_id:1(root), 2(manager), 3(staff)
ROLE_DEFAULTS: dict[int, list[str]] = {
    1: list(DEFAULT_PERMS.keys()),  # root có tất cả
    2: [
        "product:view", "product:create", "product:update",
        "category:manage", "order:view", "order:update_status"
    ],
    3: ["product:view", "order:view"],
}

def ensure_permissions(db: Session) -> None:
    # 1) đảm bảo permissions có đủ
    existing = {p.code for p in db.execute(select(Permission)).scalars().all()}
    for code, (name, desc) in DEFAULT_PERMS.items():
        if code not in existing:
            db.add(Permission(code=code, name=name, description=desc, is_system=True))
    db.flush()

    # 2) gán mặc định cho role
    roles = {r.id: r for r in db.execute(select(Role)).scalars().all()}
    for role_id, codes in ROLE_DEFAULTS.items():
        role = roles.get(role_id)
        if not role:
            continue
        code2perm = {p.code: p for p in db.execute(select(Permission)).scalars().all()}
        for c in codes:
            perm = code2perm.get(c)
            if perm and perm not in role.permissions:  # tránh trùng
                role.permissions.append(perm)
    db.commit()
