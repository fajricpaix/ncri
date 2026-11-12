from types import SimpleNamespace

from app.config import settings
from app.ratelimit import client_ip


def req(xff=None, host="10.0.0.9"):
    return SimpleNamespace(headers={"x-forwarded-for": xff} if xff else {}, client=SimpleNamespace(host=host))


def test_xff_ignored_without_trusted_proxy_so_clients_cannot_spoof(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 0)
    assert client_ip(req("1.2.3.4")) == "10.0.0.9"


def test_real_ip_taken_from_trusted_hop_not_from_client_supplied_left_entries(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    assert client_ip(req("6.6.6.6, 203.0.113.7")) == "203.0.113.7"  # entri kiri = palsu dari klien
    assert client_ip(req(None)) == "10.0.0.9"


# ---- lockout berbasis DB (sqlite in-memory; tabelnya hanya tipe sederhana) ----
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app import lockout
from app.models import LoginFailure

T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)


@pytest.fixture()
def db():
    eng = create_engine("sqlite://")
    LoginFailure.__table__.create(eng)
    with Session(eng) as s:
        yield s


def test_attempts_are_reserved_up_to_the_limit_then_locked_per_account_and_expire(db, monkeypatch):
    monkeypatch.setattr(settings, "login_max_failures", 3)
    monkeypatch.setattr(settings, "login_lock_minutes", 15)
    got = [lockout.reserve_attempt(db, "A@x.id", now=T0 + timedelta(seconds=i)) for i in range(5)]
    assert got == [True, True, True, False, False]                                   # hanya 3 pemeriksaan sandi
    assert lockout.reserve_attempt(db, "b@x.id", now=T0)                              # akun lain bebas
    assert not lockout.reserve_attempt(db, " a@X.id ", now=T0 + timedelta(minutes=5)) # email dinormalisasi
    assert lockout.reserve_attempt(db, "a@x.id", now=T0 + timedelta(minutes=16))      # jendela lewat => terbuka
    lockout.clear(db, "a@x.id"); db.commit()
    assert all(lockout.reserve_attempt(db, "a@x.id", now=T0 + timedelta(minutes=20)) for _ in range(3))  # sukses menghapus


def test_flooding_random_emails_cannot_unlock_a_locked_account(db, monkeypatch):
    """Regresi review #2: eviksi memori dulu bisa membuang kunci korban."""
    monkeypatch.setattr(settings, "login_max_failures", 3)
    monkeypatch.setattr(settings, "login_lock_minutes", 15)
    for i in range(3):
        assert lockout.reserve_attempt(db, "korban@x.id", now=T0 + timedelta(seconds=i))
    for i in range(5_000):
        lockout.reserve_attempt(db, f"spam{i}@x.id", now=T0 + timedelta(seconds=10))
    assert not lockout.reserve_attempt(db, "korban@x.id", now=T0 + timedelta(minutes=5))
