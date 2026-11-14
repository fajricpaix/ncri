"""hapus nilai SIMULATED dari enum origin dan kolom risk_assessments.is_simulated

Baris lama berlabel SIMULATED dipindah ke PARTNER (tidak ada data yang dihapus).

Revision ID: b7e2d94c1a30
Revises: a1c3e5f70809
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b7e2d94c1a30'
down_revision: Union[str, Sequence[str], None] = 'a1c3e5f70809'
branch_labels = None
depends_on = None

TABLES = ("cultural_objects", "indicator_observations")


def _retype(values: str, using: str) -> None:
    op.execute("ALTER TYPE origin RENAME TO origin_old")
    op.execute(f"CREATE TYPE origin AS ENUM ({values})")
    for t in TABLES:
        op.execute(f"ALTER TABLE {t} ALTER COLUMN data_origin TYPE origin USING {using}")
    op.execute("DROP TYPE origin_old")


def upgrade() -> None:
    for t in TABLES:
        op.execute(f"UPDATE {t} SET data_origin = 'PARTNER' WHERE data_origin = 'SIMULATED'")
    _retype("'PUBLIC', 'PARTNER'", "data_origin::text::origin")
    op.drop_column('risk_assessments', 'is_simulated')


def downgrade() -> None:
    op.add_column('risk_assessments', sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default=sa.false()))
    _retype("'PUBLIC', 'SIMULATED', 'PARTNER'", "data_origin::text::origin")
