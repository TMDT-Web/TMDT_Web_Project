"""merge_migration_heads

Revision ID: 7639dc7054dd
Revises: 79db8f4d3946, change_enums_to_lowercase
Create Date: 2025-12-02 04:19:25.098587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7639dc7054dd'
down_revision: Union[str, None] = ('79db8f4d3946', 'change_enums_to_lowercase')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
