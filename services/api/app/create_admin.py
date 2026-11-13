"""Bikin/reset satu ADMIN (satu-satunya cara punya user di produksi, karena akun demo hanya di development).
Pakai: ADMIN_EMAIL=... ADMIN_PASSWORD=... python -m app.create_admin"""
import os
import sys

from sqlalchemy import select

from app import auth, models as m
from app.db import SessionLocal

email, pw = os.getenv("ADMIN_EMAIL", "").strip().lower(), os.getenv("ADMIN_PASSWORD", "")
if not email or len(pw) < 12:
    sys.exit("ADMIN_EMAIL wajib, ADMIN_PASSWORD minimal 12 karakter")
with SessionLocal() as db:
    u = db.scalar(select(m.User).where(m.User.email == email))
    if u:
        u.password_hash, u.role, u.is_active, u.token_version = auth.hash_password(pw), m.Role.ADMIN, True, u.token_version + 1
    else:
        db.add(m.User(name="Admin", email=email, role=m.Role.ADMIN, password_hash=auth.hash_password(pw)))
    db.commit()
print("admin ok:", email)
