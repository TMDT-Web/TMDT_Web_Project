"""change_enums_to_lowercase

Revision ID: change_enums_to_lowercase
Revises: 314e009ed192
Create Date: 2025-11-29 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'change_enums_to_lowercase'
down_revision = '314e009ed192'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert viptier enum to lowercase labels
    conn = op.get_bind()
    conn.execute(sa.text("CREATE TYPE viptier_new AS ENUM ('member','silver','gold','diamond')"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN vip_tier TYPE viptier_new USING lower(vip_tier::text)::viptier_new"))
    conn.execute(sa.text("DROP TYPE viptier"))
    conn.execute(sa.text("ALTER TYPE viptier_new RENAME TO viptier"))

    # Convert userrole enum to lowercase labels
    conn.execute(sa.text("CREATE TYPE userrole_new AS ENUM ('customer','staff','admin')"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING lower(role::text)::userrole_new"))
    conn.execute(sa.text("DROP TYPE userrole"))
    conn.execute(sa.text("ALTER TYPE userrole_new RENAME TO userrole"))


def downgrade() -> None:
    # Downgrade is destructive; recreate uppercase enums
    conn = op.get_bind()
    conn.execute(sa.text("CREATE TYPE viptier_old AS ENUM ('MEMBER','SILVER','GOLD','DIAMOND')"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN vip_tier TYPE viptier_old USING upper(vip_tier::text)::viptier_old"))
    conn.execute(sa.text("DROP TYPE viptier"))
    conn.execute(sa.text("ALTER TYPE viptier_old RENAME TO viptier"))

    conn.execute(sa.text("CREATE TYPE userrole_old AS ENUM ('CUSTOMER','STAFF','ADMIN')"))
    conn.execute(sa.text("ALTER TABLE users ALTER COLUMN role TYPE userrole_old USING upper(role::text)::userrole_old"))
    conn.execute(sa.text("DROP TYPE userrole"))
    conn.execute(sa.text("ALTER TYPE userrole_old RENAME TO userrole"))
