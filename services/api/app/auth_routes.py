import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import auth, lockout, models as m
from app.config import settings
from app.db import get_db
from app.ratelimit import Limiter

router = APIRouter()
DB = Depends(get_db)
login_limiter = Limiter(lambda: settings.login_rate_per_minute, "terlalu banyak percobaan login")


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: m.Role
    is_active: bool


class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=auth.MIN_PASSWORD)
    role: m.Role


class UserPatch(BaseModel):
    role: m.Role | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=auth.MIN_PASSWORD)


@router.post("/auth/login", response_model=UserOut, dependencies=[Depends(login_limiter)])
def login(body: LoginIn, response: Response, db: Session = DB):
    email = body.email.strip().lower()
    if not lockout.reserve_attempt(db, email):  # atomik, sebelum hashing: terkunci = tidak memakan CPU
        raise HTTPException(429, f"terlalu banyak gagal login; coba lagi dalam {settings.login_lock_minutes} menit")
    user = db.scalar(select(m.User).where(m.User.email == email))
    ok = auth.verify_password(body.password, user.password_hash if user else auth._DUMMY)
    if not (user and ok and user.is_active):
        auth.audit(db, None, "auth.login_failed", "user", None, {"email": email[:100]})
        db.commit()
        raise HTTPException(401, "email atau kata sandi salah")
    lockout.clear(db, email)
    auth.set_session(response, user)
    auth.audit(db, user, "auth.login", "user", user.id)
    db.commit()
    return user


@router.post("/auth/logout")
def logout(request: Request, response: Response, db: Session = DB):
    """Mencabut sesi di sisi server (token_version naik): token yang dicuri/diputar ulang tidak berlaku lagi.
    Konsekuensi: perangkat lain milik akun yang sama ikut keluar."""
    token = request.cookies.get(auth.COOKIE)
    parsed = auth.read_token(token) if token else None
    user = db.get(m.User, parsed[0]) if parsed else None
    if user and user.token_version == parsed[1]:
        user.token_version += 1
        auth.audit(db, user, "auth.logout", "user", user.id)
        db.commit()
    auth.clear_session(response)
    return {"ok": True}


@router.get("/auth/me", response_model=UserOut)
def me(user: m.User = Depends(auth.current_user)):
    return user


@router.get("/users", response_model=list[UserOut], dependencies=[auth.ADMIN])
def list_users(db: Session = DB):
    return db.scalars(select(m.User).order_by(m.User.email)).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, admin: m.User = auth.ADMIN, db: Session = DB):
    email = body.email.lower()
    if db.scalar(select(m.User.id).where(m.User.email == email)):
        raise HTTPException(409, "email sudah terdaftar")
    u = m.User(name=body.name, email=email, password_hash=auth.hash_password(body.password), role=body.role)
    db.add(u)
    db.flush()
    auth.audit(db, admin, "user.create", "user", u.id, {"role": body.role.value})
    db.commit()
    return u


@router.patch("/users/{id}", response_model=UserOut)
def patch_user(id: uuid.UUID, body: UserPatch, admin: m.User = auth.ADMIN, db: Session = DB):
    u = db.get(m.User, id)
    if not u:
        raise HTTPException(404, "pengguna tidak ditemukan")
    if u.id == admin.id and (body.is_active is False or (body.role and body.role != m.Role.ADMIN)):
        raise HTTPException(409, "tidak bisa menonaktifkan atau menurunkan role akun sendiri")
    changes = {}
    if body.role is not None:
        u.role, changes["role"] = body.role, body.role.value
    if body.is_active is not None:
        u.is_active, changes["is_active"] = body.is_active, body.is_active
    if body.password:
        u.password_hash, changes["password_reset"] = auth.hash_password(body.password), True
    if changes:
        u.token_version += 1  # sandi/role/status berubah => sesi lama dicabut
    auth.audit(db, admin, "user.update", "user", u.id, changes)
    db.commit()
    return u


@router.get("/audit-logs", dependencies=[auth.ADMIN])
def audit_logs(limit: int = 100, db: Session = DB):
    users = {u.id: u.email for u in db.scalars(select(m.User))}
    q = select(m.AuditLog).order_by(m.AuditLog.created_at.desc()).limit(min(limit, 500))
    return [{"id": a.id, "at": a.created_at, "user": users.get(a.user_id), "action": a.action,
             "entity_type": a.entity_type, "entity_id": a.entity_id, "metadata": a.meta} for a in db.scalars(q)]
