"""merge_chat_and_collection_changes

Revision ID: f4ac62403424
Revises: 79db8f4d3946, b5f3a8c91d2e
Create Date: 2025-11-24 16:36:05.307589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4ac62403424'
down_revision: Union[str, None] = ('79db8f4d3946', 'b5f3a8c91d2e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
