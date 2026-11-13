"""Katalog & generator data contoh (SEMUA SIMULATED). Fungsi murni dan deterministik: tanpa DB.

Nama objek budaya adalah objek nyata, tetapi SEMUA angka indikator dibuat oleh generator ini (rng tetap) untuk demo.
Tidak ada satu pun angka di sini yang boleh dibaca sebagai kondisi sebenarnya."""
import random
from datetime import date

YEARS = list(range(2019, 2025))  # 6 periode => 5 penilaian per objek (menutup syarat 'periode terpanjang' kerangka prediksi)
INDICATORS = ["ACTIVE_PRACTITIONERS", "SUCCESSORS", "ACTIVITY_FREQUENCY", "ACTIVE_COMMUNITIES", "KNOWLEDGE_TRANSFER"]
TRAINING = "TRAINING_PARTICIPANTS"  # bobot 0: tidak masuk skor, hanya konteks

# profil lintasan: rentang pertumbuhan tahunan pada periode TERAKHIR; penurunan makin curam mendekati 2024
PROFILES = {
    "crit": (-0.58, -0.45), "high": (-0.42, -0.37), "mid": (-0.30, -0.23), "low": (-0.11, -0.03),
    "stable": (-0.03, 0.03), "grow": (0.06, 0.15),
}
MULT = {"ACTIVE_PRACTITIONERS": 1.0, "SUCCESSORS": 1.15, "ACTIVITY_FREQUENCY": 0.85, "ACTIVE_COMMUNITIES": 0.7, "KNOWLEDGE_TRANSFER": 1.05}

# (kode, nama, kategori, kode provinsi, profil, terverifikasi-lapangan)
# profil tambahan: "gap" = seperti mid tetapi periode 2022 hilang pada 2 indikator; "sparse" = hanya 1 periode; "none" = tanpa observasi
CATALOG = [
    ("OBJ-101", "Tari Saman", "Kesenian", "11", "grow", True),
    ("OBJ-102", "Tari Pendet", "Kesenian", "51", "low", False),
    ("OBJ-103", "Tari Kecak", "Kesenian", "51", "stable", True),
    ("OBJ-104", "Wayang Kulit Purwa", "Kesenian", "33", "mid", True),
    ("OBJ-105", "Randai", "Kesenian", "13", "high", False),
    ("OBJ-106", "Tari Piring", "Kesenian", "13", "low", False),
    ("OBJ-107", "Tor-Tor", "Kesenian", "12", "mid", False),
    ("OBJ-108", "Ondel-ondel", "Kesenian", "31", "gap", False),
    ("OBJ-109", "Jaipongan", "Kesenian", "32", "low", True),
    ("OBJ-110", "Lengger Banyumasan", "Kesenian", "33", "crit", False),
    ("OBJ-111", "Ludruk", "Kesenian", "35", "high", False),
    ("OBJ-112", "Sasando", "Kesenian", "53", "mid", False),
    ("OBJ-113", "Debus Banten", "Kesenian", "36", "mid", False),
    ("OBJ-114", "Tari Gandrung", "Kesenian", "35", "stable", False),
    ("OBJ-115", "Mak Yong", "Kesenian", "14", "crit", True),
    ("OBJ-120", "Batik Tulis Lasem", "Kerajinan", "33", "high", True),
    ("OBJ-121", "Songket Palembang", "Kerajinan", "16", "low", False),
    ("OBJ-122", "Tenun Ikat Troso", "Kerajinan", "33", "low", False),
    ("OBJ-123", "Ulos Batak", "Kerajinan", "12", "mid", False),
    ("OBJ-124", "Kerajinan Perak Kotagede", "Kerajinan", "34", "mid", True),
    ("OBJ-125", "Gerabah Kasongan", "Kerajinan", "34", "low", False),
    ("OBJ-126", "Tenun Bugis Sengkang", "Kerajinan", "73", "gap", False),
    ("OBJ-127", "Noken Papua", "Kerajinan", "91", "high", False),
    ("OBJ-128", "Kain Gringsing Tenganan", "Kerajinan", "51", "crit", True),
    ("OBJ-129", "Anyaman Purun", "Kerajinan", "63", "mid", False),
    ("OBJ-130", "Tenun Corak Insang Sambas", "Kerajinan", "61", "high", False),
    ("OBJ-140", "Rambu Solo", "Tradisi", "73", "stable", True),
    ("OBJ-141", "Pasola", "Tradisi", "53", "stable", False),
    ("OBJ-142", "Ngaben", "Tradisi", "51", "stable", False),
    ("OBJ-143", "Tabuik Pariaman", "Tradisi", "13", "low", False),
    ("OBJ-144", "Karapan Sapi", "Tradisi", "35", "mid", False),
    ("OBJ-145", "Pacu Jalur", "Tradisi", "14", "grow", False),
    ("OBJ-146", "Dugderan Semarang", "Tradisi", "33", "low", False),
    ("OBJ-147", "Sekaten", "Tradisi", "34", "stable", False),
    ("OBJ-148", "Tiwah Dayak Ngaju", "Tradisi", "62", "high", True),
    ("OBJ-149", "Makepung Jembrana", "Tradisi", "51", "mid", False),
    ("OBJ-160", "Subak", "Pengetahuan Lokal", "51", "stable", True),
    ("OBJ-161", "Jamu Gendong", "Pengetahuan Lokal", "33", "mid", False),
    ("OBJ-162", "Sasi Maluku", "Pengetahuan Lokal", "81", "mid", False),
    ("OBJ-163", "Pranata Mangsa", "Pengetahuan Lokal", "33", "crit", False),
    ("OBJ-164", "Pembuatan Perahu Pinisi", "Pengetahuan Lokal", "73", "mid", True),
    ("OBJ-165", "Ramuan Obat Dayak", "Pengetahuan Lokal", "62", "high", False),
    ("OBJ-166", "Usada Bali", "Pengetahuan Lokal", "51", "mid", False),
    ("OBJ-170", "Rumah Gadang", "Cagar Budaya", "13", "mid", False),
    ("OBJ-171", "Rumah Betang", "Cagar Budaya", "62", "high", False),
    ("OBJ-172", "Tongkonan", "Cagar Budaya", "73", "low", True),
    ("OBJ-173", "Omo Sebua Nias", "Cagar Budaya", "12", "high", False),
    ("OBJ-174", "Rumah Honai", "Cagar Budaya", "91", "high", False),
    ("OBJ-180", "Bahasa Using", "Bahasa Daerah", "35", "mid", False),
    ("OBJ-181", "Bahasa Tobelo", "Bahasa Daerah", "82", "crit", True),
    ("OBJ-182", "Bahasa Sasak", "Bahasa Daerah", "52", "low", False),
    ("OBJ-183", "Bahasa Gorontalo", "Bahasa Daerah", "75", "low", False),
    ("OBJ-184", "Bahasa Kaili", "Bahasa Daerah", "72", "mid", False),
    ("OBJ-185", "Bahasa Wolio", "Bahasa Daerah", "74", "high", False),
    ("OBJ-186", "Bahasa Minahasa", "Bahasa Daerah", "71", "mid", False),
    ("OBJ-187", "Bahasa Sangir", "Bahasa Daerah", "71", "high", False),
    ("OBJ-190", "Tari Cakalele", "Kesenian", "81", "sparse", False),
    ("OBJ-191", "Tenun Ikat Sikka", "Kerajinan", "53", "sparse", False),
    ("OBJ-192", "Tari Dolalak", "Kesenian", "33", "none", False),
    ("OBJ-193", "Tari Hudoq", "Kesenian", "64", "none", False),
    ("OBJ-194", "Naskah Lontara", "Pengetahuan Lokal", "73", "sparse", False),
]

# skala dasar per kategori: (pelaku, komunitas, kegiatan)
SCALE = {"Kesenian": ((60, 400), (3, 24), (6, 48)), "Kerajinan": ((40, 300), (3, 20), (6, 40)),
         "Tradisi": ((150, 900), (4, 28), (2, 20)), "Pengetahuan Lokal": ((30, 250), (2, 15), (4, 30)),
         "Cagar Budaya": ((20, 120), (2, 12), (3, 24)), "Bahasa Daerah": ((500, 20000), (5, 40), (6, 36))}

SOURCES = [  # kode, nama, tipe, deskripsi
    ("SIM-DAPOBUD", "Simulasi: ekspor DAPOBUD", "GOVERNMENT", "Data sintetis berbentuk ekspor pendataan pemerintah. BUKAN data resmi."),
    ("SIM-SURVEI", "Simulasi: survei lapangan", "SURVEY", "Data sintetis berstatus terverifikasi lapangan. BUKAN data resmi."),
    ("SIM-KOMUNITAS", "Simulasi: laporan komunitas", "COMMUNITY", "Data sintetis dari laporan komunitas. BUKAN data resmi."),
    ("SIM-BPS", "Simulasi: statistik pelatihan", "PUBLIC_DATA", "Data sintetis berbentuk statistik publik. BUKAN data resmi."),
]


def build(seed: int = 2026):
    """Return (objects, observations). observations: dict(object, indicator, year, value, source, verified)."""
    rng = random.Random(seed)
    objects, obs = [], []
    for code, name, cat, prov, profile, verified in CATALOG:
        objects.append({"code": code, "name": name, "category": cat, "province": prov, "profile": profile, "verified": verified})
        if profile == "none":
            continue
        (p_lo, p_hi), (c_lo, c_hi), (f_lo, f_hi) = SCALE[cat]
        base = {
            "ACTIVE_PRACTITIONERS": rng.uniform(p_lo, p_hi),
            "ACTIVITY_FREQUENCY": rng.uniform(f_lo, f_hi),
            "ACTIVE_COMMUNITIES": rng.uniform(c_lo, c_hi),
            "KNOWLEDGE_TRANSFER": rng.uniform(4, 30),
        }
        base["SUCCESSORS"] = base["ACTIVE_PRACTITIONERS"] * rng.uniform(0.08, 0.25)
        training = rng.uniform(10, 150)
        g_end = rng.uniform(*PROFILES["mid" if profile in ("gap", "sparse") else profile])
        mult = {k: v * rng.uniform(0.9, 1.1) for k, v in MULT.items()}
        primary = "SIM-KOMUNITAS" if rng.random() < 0.15 else "SIM-DAPOBUD"
        vals = dict(base)
        for k, year in enumerate(YEARS):
            if k > 0:  # transisi menuju `year`; makin curam mendekati periode terakhir
                ramp = k / (len(YEARS) - 1)
                for ind in INDICATORS:
                    vals[ind] *= max(0.05, 1 + g_end * ramp * mult[ind])
                training *= max(0.2, 1 + g_end * ramp * 0.6)
            if profile == "sparse" and year != YEARS[-1]:
                continue
            for ind in (INDICATORS[:2] if profile == "sparse" else INDICATORS):
                if profile == "gap" and year == 2022 and ind in ("SUCCESSORS", "KNOWLEDGE_TRANSFER"):
                    continue  # periode hilang: harus tampil sebagai gap, bukan nol
                v = max(1, round(vals[ind] * rng.uniform(0.97, 1.03)))
                obs.append({"object": code, "indicator": ind, "year": year, "value": v, "source": primary, "verified": False})
                if verified and year >= YEARS[-2]:  # survei lapangan untuk 2 periode terakhir menimpa nilai tak-terverifikasi
                    obs.append({"object": code, "indicator": ind, "year": year, "source": "SIM-SURVEI", "verified": True,
                                "value": max(1, round(v * rng.uniform(0.97, 1.03)))})
            if profile != "sparse":
                obs.append({"object": code, "indicator": TRAINING, "year": year, "source": "SIM-BPS", "verified": False,
                            "value": max(1, round(training * rng.uniform(0.95, 1.05)))})
    return objects, obs


def period(year: int):
    return date(year, 1, 1), date(year, 12, 31)
