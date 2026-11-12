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
        now = time.monotonic()
        if len(self.hits) > 10_000:  # buang hanya IP yang jendelanya sudah habis
            for ip in [k for k, v in self.hits.items() if not v or now - v[-1] > 60]:
                del self.hits[ip]
        q = self.hits[client_ip(request)]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute():
            raise HTTPException(429, self.message)
        q.append(now)
