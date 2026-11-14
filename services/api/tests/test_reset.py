from app.db import Base
import app.models  # noqa: F401
from app.routes import RESET_TABLES

KEEP = {"regions", "indicators", "users", "app_settings", "audit_logs", "login_failures"}


def test_reset_covers_every_table_that_references_wiped_data():
    for t in Base.metadata.sorted_tables:
        if t.name in RESET_TABLES:
            continue
        assert t.name in KEEP, f"tabel baru '{t.name}': masukkan ke RESET_TABLES atau KEEP"
        assert not ({fk.column.table.name for fk in t.foreign_keys} & set(RESET_TABLES)), t.name  # TRUNCATE akan gagal
