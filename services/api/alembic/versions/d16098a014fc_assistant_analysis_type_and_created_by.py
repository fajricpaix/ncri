"""assistant analysis type and created_by

Revision ID: d16098a014fc
Revises: 5b11f137933c
Create Date: 2026-11-12 18:06:35.304711

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = 'd16098a014fc'
down_revision: Union[str, Sequence[str], None] = '5b11f137933c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE analysistype ADD VALUE IF NOT EXISTS 'ASSISTANT'")
    op.add_column("llm_analyses", sa.Column("created_by", sa.UUID(), nullable=True))
    op.create_foreign_key("llm_analyses_created_by_fkey", "llm_analyses", "users", ["created_by"], ["id"])


def downgrade() -> None:
    op.drop_constraint("llm_analyses_created_by_fkey", "llm_analyses", type_="foreignkey")
    op.drop_column("llm_analyses", "created_by")  # nilai enum ASSISTANT tidak bisa dihapus di Postgres
