"""Autentikasi (JWT di cookie httpOnly) dan otorisasi berbasis role."""
import base64
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app import models as m
from app.config import settings
from app.db import get_db

COOKIE = "ncri_session"
CSRF_HEADER, CSRF_VALUE = "x-ncri-client", "web"
MIN_PASSWORD = 10
ROLES = m.Role


# ---------- password (stdlib scrypt) ----------
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return "scrypt$16384$8$1$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(h).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        _, n, r, p, salt, h = stored.split("$")
        calc = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p), dklen=32)
        return hmac.compare_digest(calc, base64.b64decode(h))
    except Exception:
        return False


_DUMMY = hash_password(secrets.token_hex(8))  # supaya waktu login tidak membocorkan apakah email ada


# ---------- token ----------
def make_token(user: m.User, now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user.id), "iat": now, "exp": now + timedelta(minutes=settings.token_ttl_minutes)},
                      settings.auth_secret, algorithm="HS256")


def read_token(token: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(jwt.decode(token, settings.auth_secret, algorithms=["HS256"])["sub"])
    except Exception:
        return None


def set_session(response: Response, user: m.User):
    response.set_cookie(COOKIE, make_token(user), max_age=settings.token_ttl_minutes * 60, httponly=True,
                        secure=settings.cookie_secure, samesite=settings.cookie_samesite, path="/")


def clear_session(response: Response):
    response.delete_cookie(COOKIE, path="/", secure=settings.cookie_secure, samesite=settings.cookie_samesite)


def check_secret():
    if settings.app_env != "development" and (len(settings.auth_secret) < 32 or settings.auth_secret.startswith("dev-only")):
        raise RuntimeError("AUTH_SECRET harus diisi (>= 32 karakter) di luar development")
    if settings.cookie_samesite.lower() == "none" and not settings.cookie_secure:
        raise RuntimeError("COOKIE_SAMESITE=none membutuhkan COOKIE_SECURE=true")


# ---------- dependencies ----------
def csrf_guard(request: Request):
    """Permintaan yang mengubah data wajib membawa header kustom: memaksa preflight CORS, sehingga
    form lintas-situs (termasuk multipart) tidak bisa menunggangi cookie sesi."""
    if request.method not in ("GET", "HEAD", "OPTIONS") and request.headers.get(CSRF_HEADER) != CSRF_VALUE:
        raise HTTPException(403, "header X-NCRI-Client wajib")


def current_user(request: Request, db: Session = Depends(get_db)) -> m.User:
    token = request.cookies.get(COOKIE)
    uid = read_token(token) if token else None
    user = db.get(m.User, uid) if uid else None
    if not user or not user.is_active:
        raise HTTPException(401, "belum login atau sesi berakhir")
    return user


def allowed(role: m.Role, needed: tuple[m.Role, ...]) -> bool:
    return role == m.Role.ADMIN or role in needed  # ADMIN boleh semua


def require(*needed: m.Role):
    def dep(user: m.User = Depends(current_user)) -> m.User:
        if not allowed(user.role, needed):
            raise HTTPException(403, "role Anda tidak berwenang untuk aksi ini")
        return user
    return dep


# izin per aksi (cermin: apps/web/src/lib/permissions.ts)
ANALYST = Depends(require(m.Role.ANALYST))
TRIAGE = Depends(require(m.Role.ANALYST, m.Role.REVIEWER))
REVIEWER = Depends(require(m.Role.REVIEWER))
ADMIN = Depends(require())


def audit(db: Session, user: m.User | None, action: str, entity_type: str, entity_id=None, meta=None):
    db.add(m.AuditLog(user_id=user.id if user else None, action=action, entity_type=entity_type,
                      entity_id=entity_id, meta=meta or {}))
