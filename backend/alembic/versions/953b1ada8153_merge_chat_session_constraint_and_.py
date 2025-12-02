"""merge_chat_session_constraint_and_remote_changes

Revision ID: 953b1ada8153
Revises: 3bcbff69a9df, 64a16f0f20fa
Create Date: 2025-12-02 04:33:41.498892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '953b1ada8153'
down_revision: Union[str, None] = ('3bcbff69a9df', '64a16f0f20fa')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
