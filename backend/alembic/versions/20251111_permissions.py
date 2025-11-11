"""permissions + role_permissions + user_permissions (idempotent)"""

from alembic import op
import sqlalchemy as sa

# sửa các id này đúng theo file của bạn nếu khác
revision = "20251111_permissions"
down_revision = "53a3d3b89cb9"  # nối sau head hiện tại
branch_labels = None
depends_on = None


def _table_exists(conn, name: str) -> bool:
    insp = sa.inspect(conn)
    return name in insp.get_table_names()


def upgrade() -> None:
    conn = op.get_bind()

    # 1) permissions
    if not _table_exists(conn, "permissions"):
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("code", sa.String(length=100), nullable=False),
            sa.Column("name", sa.String(length=150), nullable=False),
            sa.Column("description", sa.String(length=255)),
            sa.Column("is_system", sa.Boolean, server_default=sa.text("true"), nullable=False),
        )
        op.create_index("ix_permissions_code", "permissions", ["code"], unique=True)

    # 2) role_permissions (role_id <-> permission_id)
    if not _table_exists(conn, "role_permissions"):
        op.create_table(
            "role_permissions",
            sa.Column("role_id", sa.Integer, nullable=False),
            sa.Column("permission_id", sa.Integer, nullable=False),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        )
        op.create_unique_constraint(
            "uq_role_permissions_role_perm",
            "role_permissions",
            ["role_id", "permission_id"],
        )

    # 3) user_permissions (user_id <-> permission_id) nếu bạn dùng
    if not _table_exists(conn, "user_permissions"):
        op.create_table(
            "user_permissions",
            sa.Column("user_id", sa.Integer, nullable=False),
            sa.Column("permission_id", sa.Integer, nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        )
        op.create_unique_constraint(
            "uq_user_permissions_user_perm",
            "user_permissions",
            ["user_id", "permission_id"],
        )


def downgrade() -> None:
    conn = op.get_bind()

    # Hạ idempotent – chỉ drop nếu tồn tại
    if _table_exists(conn, "user_permissions"):
        op.drop_constraint("uq_user_permissions_user_perm", "user_permissions", type_="unique")
        op.drop_table("user_permissions")

    if _table_exists(conn, "role_permissions"):
        op.drop_constraint("uq_role_permissions_role_perm", "role_permissions", type_="unique")
        op.drop_table("role_permissions")

    if _table_exists(conn, "permissions"):
        op.drop_index("ix_permissions_code", table_name="permissions")
        op.drop_table("permissions")
