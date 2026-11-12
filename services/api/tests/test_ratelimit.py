from types import SimpleNamespace

from app.config import settings
from app.ratelimit import FailureTracker, client_ip


def req(xff=None, host="10.0.0.9"):
    return SimpleNamespace(headers={"x-forwarded-for": xff} if xff else {}, client=SimpleNamespace(host=host))


def test_xff_ignored_without_trusted_proxy_so_clients_cannot_spoof(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 0)
    assert client_ip(req("1.2.3.4")) == "10.0.0.9"


def test_real_ip_taken_from_trusted_hop_not_from_client_supplied_left_entries(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    assert client_ip(req("6.6.6.6, 203.0.113.7")) == "203.0.113.7"  # entri kiri = palsu dari klien
    assert client_ip(req(None)) == "10.0.0.9"


def test_account_lock_after_repeated_failures_expires_and_clears():
    t = FailureTracker(lambda: 3, lambda: 60)
    for i in range(3):
        assert not t.blocked("a@x", now=i)
        t.fail("a@x", now=i)
    assert t.blocked("a@x", now=10) and not t.blocked("b@x", now=10)   # akun lain tidak ikut terkunci
    assert not t.blocked("a@x", now=70)                                  # jendela lewat => terbuka lagi
    t.fail("c@x", now=0); t.fail("c@x", now=1); t.clear("c@x")
    assert not t.blocked("c@x", now=2)                                   # login sukses menghapus hitungan


def test_failure_tracker_memory_is_bounded():
    t = FailureTracker(lambda: 5, lambda: 3600)
    t.MAX_KEYS = 100
    for i in range(1000):
        t.fail(f"spam{i}@x", now=i)
    assert len(t.fails) <= 100
