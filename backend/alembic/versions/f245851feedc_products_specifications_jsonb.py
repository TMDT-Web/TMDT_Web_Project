"""products.specifications -> JSONB"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "53a3d3b89cb9"
down_revision = "be313f18577f"  # <-- giữ nguyên cái có sẵn trong file
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "products",
        "specifications",
        type_=postgresql.JSONB(astext_type=sa.Text()),
        postgresql_using="specifications::jsonb",
    )


def downgrade():
    op.alter_column(
        "products",
        "specifications",
        type_=postgresql.JSON(astext_type=sa.Text()),
        postgresql_using="specifications::json",
    )

