"""ai_submissions: staging data hasil pencarian AI (butuh verifikasi sebelum masuk dashboard)

Revision ID: c4f9a2d81e57
Revises: b7e2d94c1a30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision: str = 'c4f9a2d81e57'
down_revision: Union[str, Sequence[str], None] = 'b7e2d94c1a30'
branch_labels = None
depends_on = None

KIND = pg.ENUM('OBJECT', 'OBSERVATION', name='submissionkind', create_type=False)
STATUS = pg.ENUM('PENDING', 'APPROVED', 'REJECTED', name='submissionstatus', create_type=False)


def upgrade() -> None:
    KIND.create(op.get_bind(), checkfirst=True)
    STATUS.create(op.get_bind(), checkfirst=True)
    op.create_table('ai_submissions',
                    sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
                    sa.Column('batch_id', pg.UUID(as_uuid=True), nullable=False),
                    sa.Column('kind', KIND, nullable=False),
                    sa.Column('payload', pg.JSONB(), nullable=False),
                    sa.Column('evidence_text', sa.Text(), nullable=False),
                    sa.Column('sources', pg.JSONB(), nullable=False),
                    sa.Column('query', sa.Text(), nullable=False),
                    sa.Column('provider', sa.String(), nullable=False),
                    sa.Column('model', sa.String(), nullable=False),
                    sa.Column('status', STATUS, nullable=False),
                    sa.Column('created_by', pg.UUID(as_uuid=True), sa.ForeignKey('users.id')),
                    sa.Column('reviewed_by', pg.UUID(as_uuid=True), sa.ForeignKey('users.id')),
                    sa.Column('reviewed_at', sa.DateTime(timezone=True)),
                    sa.Column('review_note', sa.Text()),
                    sa.Column('result_id', pg.UUID(as_uuid=True)),
                    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_ai_submissions_batch_id', 'ai_submissions', ['batch_id'])
    op.create_index('ix_ai_submissions_status', 'ai_submissions', ['status'])


def downgrade() -> None:
    op.drop_table('ai_submissions')
    STATUS.drop(op.get_bind(), checkfirst=True)
    KIND.drop(op.get_bind(), checkfirst=True)
