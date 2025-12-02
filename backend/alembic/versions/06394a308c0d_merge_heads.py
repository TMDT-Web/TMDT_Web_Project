"""merge_heads

Revision ID: 06394a308c0d
Revises: 79db8f4d3946, change_enums_to_lowercase
Create Date: 2025-12-01 13:20:09.207995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06394a308c0d'
down_revision: Union[str, None] = ('79db8f4d3946', 'change_enums_to_lowercase')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
