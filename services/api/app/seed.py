"""Seed idempotent: wilayah (38 provinsi), indikator, sumber & objek SIMULASI. Jalankan: python -m app.seed"""
from sqlalchemy import select

from app import models as m
import os

from app import auth
from app.config import settings
from app.db import SessionLocal

PROVINCES = {
    "11": "Aceh", "12": "Sumatera Utara", "13": "Sumatera Barat", "14": "Riau", "15": "Jambi",
    "16": "Sumatera Selatan", "17": "Bengkulu", "18": "Lampung", "19": "Kepulauan Bangka Belitung",
    "21": "Kepulauan Riau", "31": "DKI Jakarta", "32": "Jawa Barat", "33": "Jawa Tengah",
    "34": "DI Yogyakarta", "35": "Jawa Timur", "36": "Banten", "51": "Bali", "52": "Nusa Tenggara Barat",
    "53": "Nusa Tenggara Timur", "61": "Kalimantan Barat", "62": "Kalimantan Tengah",
    "63": "Kalimantan Selatan", "64": "Kalimantan Timur", "65": "Kalimantan Utara", "71": "Sulawesi Utara",
    "72": "Sulawesi Tengah", "73": "Sulawesi Selatan", "74": "Sulawesi Tenggara", "75": "Gorontalo",
    "76": "Sulawesi Barat", "81": "Maluku", "82": "Maluku Utara", "91": "Papua", "92": "Papua Barat",
    "93": "Papua Selatan", "94": "Papua Tengah", "95": "Papua Pegunungan", "96": "Papua Barat Daya",
}
LOW, HIGH = m.Direction.LOWER_IS_WORSE, m.Direction.HIGHER_IS_WORSE
# (code, name, unit, direction, weight, availability) — bobot = contoh blueprint, WAJIB divalidasi ahli
INDICATORS = [
    ("ACTIVE_PRACTITIONERS", "Jumlah pelaku aktif", "orang", LOW, 0.25),
    ("SUCCESSORS", "Jumlah penerus/peserta belajar", "orang", LOW, 0.25),
    ("ACTIVITY_FREQUENCY", "Frekuensi kegiatan per periode", "kegiatan/tahun", LOW, 0.20),
    ("ACTIVE_COMMUNITIES", "Jumlah komunitas aktif", "komunitas", LOW, 0.15),
    ("KNOWLEDGE_TRANSFER", "Aktivitas pewarisan pengetahuan", "kegiatan/tahun", LOW, 0.15),
    ("TRAINING_PARTICIPANTS", "Peserta pelatihan", "orang", LOW, 0.0),
    ("DATA_FRESHNESS_DAYS", "Umur data sejak pembaruan", "hari", HIGH, 0.0),
]
# objek budaya nyata, tetapi seluruh angka indikatornya SIMULASI
OBJECTS = [
    ("OBJ-001", "Tari Topeng Cirebon", "Kesenian", "32"),
    ("OBJ-002", "Kain Tenun Sumba", "Kerajinan", "53"),
    ("OBJ-003", "Gamelan Salendro", "Kesenian", "33"),
    ("OBJ-004", "Tradisi Bau Nyale", "Tradisi", "52"),
    ("OBJ-005", "Ukir Jepara", "Kerajinan", "33"),
    ("OBJ-006", "Reog Ponorogo", "Kesenian", "35"),  # sengaja tanpa observasi => INSUFFICIENT_DATA
]


def run():
    with SessionLocal() as db:
        have = set(db.scalars(select(m.Region.code)))
        for code, name in PROVINCES.items():
            if code not in have:
                db.add(m.Region(code=code, name=name, level=m.RegionLevel.PROVINCE))
        have = set(db.scalars(select(m.Indicator.code)))
        for code, name, unit, direction, w in INDICATORS:
            if code not in have:
                avail = m.Availability.PARTIAL if w else m.Availability.NOT_AVAILABLE
                db.add(m.Indicator(code=code, name=name, description=name, unit=unit,
                                   direction=direction, default_weight=w, availability=avail))
        if not db.scalar(select(m.DataSource).where(m.DataSource.code == "SIM-01")):
            db.add(m.DataSource(code="SIM-01", name="Data simulasi NCRI", source_type=m.SourceType.MANUAL,
                                description="Data sintetis untuk demo teknis. BUKAN data resmi.",
                                license_notes="Dibuat internal"))
        db.flush()
        regions = {r.code: r.id for r in db.scalars(select(m.Region))}
        have = set(db.scalars(select(m.CulturalObject.external_code)))
        for code, name, cat, prov in OBJECTS:
            if code not in have:
                db.add(m.CulturalObject(external_code=code, name=name, category=cat, region_id=regions[prov],
                                        data_origin=m.Origin.SIMULATED))
        if settings.app_env == "development":  # akun demo HANYA di development
            pw = os.getenv("DEMO_PASSWORD", "ncri-demo-123")
            have = set(db.scalars(select(m.User.email)))
            for role in m.Role:
                email = f"{role.value.lower()}@ncri.local"
                if email not in have:
                    db.add(m.User(name=f"Demo {role.value.title()}", email=email, role=role,
                                  password_hash=auth.hash_password(pw)))
        db.commit()
    print("seed ok")


if __name__ == "__main__":
    run()
