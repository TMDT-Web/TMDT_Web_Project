"""add assigned_at to role_permissions (idempotent)"""

from alembic import op
import sqlalchemy as sa

# sửa cho khớp với hệ thống version của bạn
revision = "a51111_assigned_at"
down_revision = "20251111_permissions"  # hoặc head hiện tại của bạn nếu khác
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres hỗ trợ IF NOT EXISTS
    op.execute("""
        ALTER TABLE role_permissions
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
    """)

def downgrade() -> None:
    # an toàn: chỉ drop nếu tồn tại
    op.execute("""
        ALTER TABLE role_permissions
        DROP COLUMN IF EXISTS assigned_at
    """)
