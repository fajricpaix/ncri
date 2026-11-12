"""Penguncian login per akun. Disimpan di database (bukan memori): tidak ada eviksi yang bisa dipakai penyerang
untuk membuka kunci korban dengan membanjiri email acak, dan berlaku lintas proses. Email tak terdaftar diperlakukan
persis sama dengan yang terdaftar, jadi tidak membocorkan keberadaan akun.

Konsekuensi yang diterima: penyerang yang mengetahui email korban bisa menguncinya selama jendela waktu (DoS terbatas);
dia tetap tidak bisa menebak sandi."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import LoginFailure


def _now(now):
    return now or datetime.now(timezone.utc)


def _key(email: str) -> str:
    return email.strip().lower()[:254]


def is_locked(db: Session, email: str, now: datetime | None = None) -> bool:
    cutoff = _now(now) - timedelta(minutes=settings.login_lock_minutes)
    n = db.scalar(select(func.count()).select_from(LoginFailure)
                  .where(LoginFailure.key == _key(email), LoginFailure.created_at > cutoff))
    return n >= settings.login_max_failures


def record_failure(db: Session, email: str, now: datetime | None = None):
    now = _now(now)
    db.add(LoginFailure(key=_key(email), created_at=now))
    # hanya baris yang sudah lewat jendela yang dihapus, jadi kunci aktif tidak pernah hilang lebih awal
    db.execute(delete(LoginFailure).where(LoginFailure.created_at <= now - timedelta(minutes=settings.login_lock_minutes)))


def clear(db: Session, email: str):
    db.execute(delete(LoginFailure).where(LoginFailure.key == _key(email)))
