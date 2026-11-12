import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class Limiter:
    """ponytail: in-memory per proses; ganti Redis bila API dijalankan multi-proses."""

    def __init__(self, per_minute, message="terlalu banyak permintaan, coba lagi sebentar"):
        self.per_minute, self.message = per_minute, message  # per_minute: callable agar bisa dibaca saat runtime
        self.hits: dict[str, deque] = defaultdict(deque)

    def __call__(self, request: Request):
        q = self.hits[request.client.host if request.client else "?"]
        now = time.monotonic()
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute():
            raise HTTPException(429, self.message)
        q.append(now)
