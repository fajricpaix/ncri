import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.config import settings


def client_ip(request: Request) -> str:
    """IP klien. Di belakang N proxy tepercaya, IP asli = entri ke-N dari kanan X-Forwarded-For
    (entri sebelah kiri bisa dipalsukan klien). Tanpa proxy tepercaya header itu diabaikan."""
    hops = settings.trusted_proxy_hops
    if hops > 0:
        parts = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
        if len(parts) >= hops:
            return parts[-hops]
    return request.client.host if request.client else "?"


class Limiter:
    """ponytail: in-memory per proses; ganti Redis bila API dijalankan multi-proses."""

    def __init__(self, per_minute, message="terlalu banyak permintaan, coba lagi sebentar"):
        self.per_minute, self.message = per_minute, message  # per_minute: callable agar bisa dibaca saat runtime
        self.hits: dict[str, deque] = defaultdict(deque)

    def __call__(self, request: Request):
        q = self.hits[client_ip(request)]
        now = time.monotonic()
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute():
            raise HTTPException(429, self.message)
        q.append(now)


class FailureTracker:
    """Kunci sementara per kunci (mis. email) setelah gagal berulang. Berlaku sama untuk akun yang tidak ada,
    jadi tidak membocorkan apakah email terdaftar. Konsekuensi: penyerang bisa mengunci akun korban selama
    jendela waktu, tetapi tidak bisa menebak sandi. ponytail: in-memory per proses."""

    MAX_KEYS = 10_000

    def __init__(self, max_failures, window_seconds):
        self.max_failures, self.window = max_failures, window_seconds  # callable agar dibaca saat runtime
        self.fails: dict[str, deque] = {}

    def _prune(self, key, now):
        q = self.fails.get(key)
        while q and now - q[0] > self.window():
            q.popleft()
        if q is not None and not q:
            del self.fails[key]

    def blocked(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        self._prune(key, now)
        return len(self.fails.get(key, ())) >= self.max_failures()

    def fail(self, key: str, now: float | None = None):
        now = time.monotonic() if now is None else now
        if len(self.fails) >= self.MAX_KEYS:  # batasi memori terhadap banjir email acak
            for k in list(self.fails)[: self.MAX_KEYS // 2]:
                self._prune(k, now)
            if len(self.fails) >= self.MAX_KEYS:
                self.fails.pop(next(iter(self.fails)))
        self.fails.setdefault(key, deque()).append(now)

    def clear(self, key: str):
        self.fails.pop(key, None)
