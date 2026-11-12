"""Penguncian login per akun, atomik. Hitungan di database (bukan memori): tidak bisa dihapus lewat banjir email acak,
dan berlaku lintas proses. Email tak terdaftar diperlakukan persis sama dengan yang terdaftar (tidak membocorkan akun).

Percobaan DIRESERVASI sebelum sandi diperiksa: di bawah kunci advisory per email, hitung percobaan dalam jendela,
tolak bila sudah penuh, kalau tidak catat percobaan ini lalu commit. Jadi permintaan paralel tidak bisa lolos
bersamaan melewati batas (tidak ada celah cek-lalu-catat); paling banyak `login_max_failures` pengecekan sandi per
jendela per email. Login sukses menghapus hitungan.

Konsekuensi yang diterima: yang tahu email korban bisa menguncinya selama jendela (DoS terbatas); sandi tetap tidak
bisa ditebak lebih dari batas itu."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from app.config import settings
from app.models import LoginFailure


def _key(email: str) -> str:
    return email.strip().lower()[:254]


def reserve_attempt(db: Session, email: str, now: datetime | None = None) -> bool:
    """True = boleh memeriksa sandi (percobaan sudah tercatat & di-commit). False = terkunci."""
    now = now or datetime.now(timezone.utc)
    key = _key(email)
    window = timedelta(minutes=settings.login_lock_minutes)
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": key})  # lepas saat commit/rollback
    db.execute(delete(LoginFailure).where(LoginFailure.created_at <= now - window))  # hanya yang sudah lewat jendela
    n = db.scalar(select(func.count()).select_from(LoginFailure)
                  .where(LoginFailure.key == key, LoginFailure.created_at > now - window))
    if n >= settings.login_max_failures:
        db.rollback()
        return False
    db.add(LoginFailure(key=key, created_at=now))
    db.commit()
    return True


def clear(db: Session, email: str):
    db.execute(delete(LoginFailure).where(LoginFailure.key == _key(email)))
