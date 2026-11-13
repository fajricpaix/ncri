"""app settings

Revision ID: a1c3e5f70809
Revises: d16098a014fc
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1c3e5f70809'
down_revision: Union[str, Sequence[str], None] = 'd16098a014fc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('app_settings',
                    sa.Column('key', sa.String(), nullable=False),
                    sa.Column('value', sa.Text(), nullable=False),
                    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
                    sa.PrimaryKeyConstraint('key'))


def downgrade() -> None:
    op.drop_table('app_settings')
