"""Buat akun admin pertama di lingkungan nyata: python -m app.create_admin email@contoh.go.id "Nama" """
import getpass
import sys

from sqlalchemy import select

from app import auth, models as m
from app.db import SessionLocal

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    email, name = sys.argv[1].lower(), sys.argv[2]
    pw = getpass.getpass(f"Kata sandi (min {auth.MIN_PASSWORD} karakter): ")
    if len(pw) < auth.MIN_PASSWORD or pw != getpass.getpass("Ulangi: "):
        sys.exit("kata sandi terlalu pendek atau tidak sama")
    with SessionLocal() as db:
        if db.scalar(select(m.User.id).where(m.User.email == email)):
            sys.exit("email sudah ada")
        db.add(m.User(name=name, email=email, role=m.Role.ADMIN, password_hash=auth.hash_password(pw)))
        db.commit()
    print("admin dibuat")
