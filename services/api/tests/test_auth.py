import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app import auth
from app.config import settings
from app.models import Role, User


def test_password_hash_roundtrip_and_salted():
    h1, h2 = auth.hash_password("kata-sandi-panjang"), auth.hash_password("kata-sandi-panjang")
    assert h1 != h2 and auth.verify_password("kata-sandi-panjang", h1)
    assert not auth.verify_password("salah", h1) and not auth.verify_password("x", "bukan-hash")


def test_token_carries_version_so_old_tokens_can_be_revoked():
    u = User(id=uuid.uuid4(), role=Role.VIEWER, token_version=3)
    assert auth.read_token(auth.make_token(u)) == (u.id, 3)  # current_user menolak bila versi di DB sudah berbeda


def test_token_roundtrip_expiry_and_tampering():
    u = User(id=uuid.uuid4(), role=Role.VIEWER)
    assert auth.read_token(auth.make_token(u)) == (u.id, 0)
    old = datetime.now(timezone.utc) - timedelta(minutes=settings.token_ttl_minutes + 5)
    assert auth.read_token(auth.make_token(u, now=old)) is None                      # kedaluwarsa
    forged = jwt.encode({"sub": str(u.id), "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, "kunci-lain", algorithm="HS256")
    assert auth.read_token(forged) is None                                           # tanda tangan salah
    assert auth.read_token("sampah") is None


@pytest.mark.parametrize("role,needed,ok", [
    (Role.ADMIN, (Role.REVIEWER,), True),        # admin boleh semua
    (Role.REVIEWER, (Role.REVIEWER,), True),
    (Role.ANALYST, (Role.REVIEWER,), False),     # analis tidak boleh menyetujui drafnya sendiri
    (Role.VIEWER, (Role.ANALYST,), False),
    (Role.VIEWER, (), False),                    # require() tanpa argumen = khusus admin
])
def test_role_matrix(role, needed, ok):
    assert auth.allowed(role, needed) is ok


def test_insecure_secret_refused_outside_development(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    with pytest.raises(RuntimeError):
        auth.check_secret()
    monkeypatch.setattr(settings, "auth_secret", "x" * 40)
    auth.check_secret()
