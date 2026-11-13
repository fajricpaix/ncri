"""Pengaturan LLM yang diisi Admin lewat UI. Kunci API disimpan terenkripsi (Fernet) di tabel app_settings.

Kunci enkripsi diturunkan dari AUTH_SECRET. Mengganti AUTH_SECRET membuat kunci tersimpan tak terbaca
(dianggap belum diisi) dan Admin harus memasukkannya lagi.
"""
import base64
import hashlib
import json
from datetime import datetime, timezone

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.orm import Session

from app import models as m
from app.config import settings

PROVIDERS = ("gemini", "anthropic")
MODELS = {  # elemen pertama = default
    "gemini": ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"],  # 2.5-* deprecated: 404 untuk key baru
    "anthropic": ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
}
DEFAULT_MODEL = {k: v[0] for k, v in MODELS.items()}


def _fernet() -> Fernet:
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(f"ncri-settings:{settings.auth_secret}".encode()).digest()))


def _get(db: Session, key: str) -> str | None:
    row = db.get(m.AppSetting, key)
    return row.value if row else None


def _put(db: Session, key: str, value: str | None):
    row = db.get(m.AppSetting, key)
    if value is None:
        if row:
            db.delete(row)
    elif row:
        row.value = value
    else:
        db.add(m.AppSetting(key=key, value=value))


def get_api_key(db: Session) -> str | None:
    token = _get(db, "llm.api_key")
    if not token:
        return None
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return None


def load(db: Session) -> dict:
    return {"provider": _get(db, "llm.provider"), "model": _get(db, "llm.model"), "api_key": get_api_key(db)}


def save(db: Session, provider: str, model: str | None, api_key: str | None):
    """api_key=None: kunci lama dipertahankan."""
    _put(db, "llm.provider", provider)
    _put(db, "llm.model", model or None)
    if api_key:
        _put(db, "llm.api_key", _fernet().encrypt(api_key.encode()).decode())
    _put(db, "llm.last_test", None)  # konfigurasi berubah => hasil tes lama tidak relevan


def clear(db: Session):
    for k in ("llm.provider", "llm.model", "llm.api_key", "llm.last_test"):
        _put(db, k, None)


def record_test(db: Session, ok: bool, message: str):
    _put(db, "llm.last_test", json.dumps({"ok": ok, "message": message[:300], "at": datetime.now(timezone.utc).isoformat()}))


def last_test(db: Session) -> dict | None:
    raw = _get(db, "llm.last_test")
    return json.loads(raw) if raw else None


def updated_at(db: Session):
    row = db.get(m.AppSetting, "llm.provider")
    return row.updated_at if row else None
