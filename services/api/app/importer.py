"""Validasi CSV observasi indikator. Fungsi murni: tidak menyentuh database."""
import csv
import io
from datetime import date

REQUIRED = ["object_external_code", "indicator_code", "period_start", "period_end",
            "value_numeric", "source_code", "data_origin"]
ORIGINS = {"PUBLIC", "PARTNER"}
MAX_ROWS = 50_000


OBJECT_REQUIRED = ["external_code", "name", "category", "region_code", "data_origin"]
OBJECT_OPTIONAL = ["description", "latitude", "longitude", "inventory_status", "source_code"]
SOURCE_REQUIRED = ["code", "name", "source_type"]
SOURCE_OPTIONAL = ["description", "access_method", "terms_url", "license_notes"]
SOURCE_TYPES = {"GOVERNMENT", "COMMUNITY", "SURVEY", "PUBLIC_DATA", "MANUAL"}


def parse_csv(raw: bytes, required: list[str] = REQUIRED) -> tuple[list[dict], str | None]:
    """Return (rows, header_error)."""
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    missing = [c for c in required if c not in (reader.fieldnames or [])]
    if missing:
        return [], "Kolom wajib tidak ada: " + ", ".join(missing)
    rows = []
    for r in reader:
        rows.append(r)
        if len(rows) > MAX_ROWS:
            return [], f"Maksimal {MAX_ROWS} baris per file"
    return rows, None


def validate_rows(rows, objects: set[str], indicators: set[str], sources: set[str]):
    """Return (valid_rows, errors). Nomor baris dimulai dari 2 (baris 1 = header)."""
    valid, errors = [], []
    for i, r in enumerate(rows, start=2):
        errs = []

        def bad(field, msg):
            errs.append({"row": i, "field": field, "message": msg})

        if r["object_external_code"] not in objects:
            bad("object_external_code", "objek tidak dikenal")
        if r["indicator_code"] not in indicators:
            bad("indicator_code", "indikator tidak dikenal")
        if r["source_code"] not in sources:
            bad("source_code", "sumber tidak dikenal")
        if r["data_origin"] not in ORIGINS:
            bad("data_origin", "harus PUBLIC atau PARTNER")
        dates = {}
        for f in ("period_start", "period_end"):
            try:
                dates[f] = date.fromisoformat(r[f])
            except (ValueError, TypeError):
                bad(f, "format tanggal harus YYYY-MM-DD")
        if len(dates) == 2 and dates["period_end"] < dates["period_start"]:
            bad("period_end", "lebih awal dari period_start")
        value = None
        if (r["value_numeric"] or "").strip() != "":
            try:
                value = float(r["value_numeric"])
            except ValueError:
                bad("value_numeric", "bukan angka")
        # nilai kosong = data hilang (tetap NULL, bukan 0)
        if errs:
            errors.extend(errs)
        else:
            valid.append({**r, **dates, "value_numeric": value})
    return valid, errors


def _check(rows, required, optional, rules):
    """rules = {field: fungsi(nilai) -> pesan galat | None}. required[0] = kunci unik: kode dobel di file ditolak."""
    valid, errors, seen = [], [], set()
    for i, r in enumerate(rows, start=2):
        errs = [{"row": i, "field": f, "message": "wajib diisi"} for f in required if not (r.get(f) or "").strip()]
        bad = {e["field"] for e in errs}
        for f, rule in rules.items():
            v = (r.get(f) or "").strip()
            if v and f not in bad and (msg := rule(v)):
                errs.append({"row": i, "field": f, "message": msg})
        key = (r.get(required[0]) or "").strip()
        if key and key in seen:
            errs.append({"row": i, "field": required[0], "message": "kode dobel di file"})
        seen.add(key)
        if errs:
            errors.extend(errs)
        else:
            valid.append({f: ((r.get(f) or "").strip() or None) for f in required + optional})
    return valid, errors


def _num(lo, hi):
    def rule(v):
        try:
            return None if lo <= float(v) <= hi else f"harus {lo} sampai {hi}"
        except ValueError:
            return "bukan angka"
    return rule


def validate_sources(rows):
    return _check(rows, SOURCE_REQUIRED, SOURCE_OPTIONAL,
                  {"source_type": lambda v: None if v in SOURCE_TYPES else "harus " + ", ".join(sorted(SOURCE_TYPES))})


def validate_objects(rows, regions: set[str], sources: set[str]):
    return _check(rows, OBJECT_REQUIRED, OBJECT_OPTIONAL, {
        "region_code": lambda v: None if v in regions else "provinsi tidak dikenal",
        "source_code": lambda v: None if v in sources else "sumber tidak dikenal",
        "data_origin": lambda v: None if v in ORIGINS else "harus PUBLIC atau PARTNER",
        "latitude": _num(-90, 90), "longitude": _num(-180, 180)})
