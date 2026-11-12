"""Validasi CSV observasi indikator. Fungsi murni: tidak menyentuh database."""
import csv
import io
from datetime import date

REQUIRED = ["object_external_code", "indicator_code", "period_start", "period_end",
            "value_numeric", "source_code", "data_origin"]
ORIGINS = {"PUBLIC", "SIMULATED", "PARTNER"}
MAX_ROWS = 50_000


def parse_csv(raw: bytes) -> tuple[list[dict], str | None]:
    """Return (rows, header_error)."""
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    missing = [c for c in REQUIRED if c not in (reader.fieldnames or [])]
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
            bad("data_origin", "harus PUBLIC, SIMULATED, atau PARTNER")
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
