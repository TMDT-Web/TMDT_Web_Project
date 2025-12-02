"""merge_heads

Revision ID: 64a16f0f20fa
Revises: 5076fb6e16f1, 793ad2b0e949
Create Date: 2025-12-02 04:15:42.975915

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64a16f0f20fa'
down_revision: Union[str, None] = ('5076fb6e16f1', '793ad2b0e949')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
