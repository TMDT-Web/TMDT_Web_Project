"""add_unique_constraint_active_session_per_user

Revision ID: 3bcbff69a9df
Revises: 5076fb6e16f1
Create Date: 2025-12-02 03:48:32.928343

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3bcbff69a9df'
down_revision: Union[str, None] = '5076fb6e16f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, close all duplicate active sessions (keep only the most recent one per user)
    op.execute("""
        UPDATE chat_sessions 
        SET status = 'CLOSED'::chatstatus
        WHERE id IN (
            SELECT id FROM (
                SELECT id, 
                       ROW_NUMBER() OVER (PARTITION BY user_id, status ORDER BY created_at DESC) as rn
                FROM chat_sessions
                WHERE status = 'ACTIVE'::chatstatus AND user_id IS NOT NULL
            ) sub
            WHERE rn > 1
        )
    """)
    
    # Add unique constraint: one active session per user
    op.create_index(
        'idx_unique_active_session_per_user',
        'chat_sessions',
        ['user_id', 'status'],
        unique=True,
        postgresql_where=sa.text("status = 'ACTIVE'::chatstatus AND user_id IS NOT NULL")
    )


def downgrade() -> None:
    op.drop_index('idx_unique_active_session_per_user', table_name='chat_sessions')
