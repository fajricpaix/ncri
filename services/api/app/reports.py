"""Peta risiko per provinsi dan laporan (JSON + CSV). Semua keluaran membawa label data simulasi."""
import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import auth, models as m, risk_service
from app.db import get_db
from app.risk import METHOD_VERSION, PARAMS, classify

router = APIRouter(dependencies=[Depends(auth.current_user)])
DB = Depends(get_db)

CAVEATS = [
    "Skor risiko memakai metodologi baseline demo yang belum divalidasi ahli (lihat docs/risk-methodology.md).",
    "Skor risiko dan data confidence adalah dua ukuran berbeda; confidence rendah berarti bukti pendukung lemah.",
    "Rekomendasi AI berstatus draft sampai disetujui manusia.",
]


def _rows(db: Session):
    """Satu baris per objek: objek + provinsi + penilaian terbaru (bila ada)."""
    regions = {r.id: r for r in db.scalars(select(m.Region))}
    latest = {a.cultural_object_id: a for a in risk_service.latest_assessments(db)}
    out = []
    for o in db.scalars(select(m.CulturalObject).order_by(m.CulturalObject.name)):
        r = regions.get(o.region_id)
        while r is not None and r.level != m.RegionLevel.PROVINCE:  # naik ke provinsi
            r = regions.get(r.parent_id)
        a = latest.get(o.id)
        out.append({
            "id": str(o.id), "name": o.name, "category": o.category, "external_code": o.external_code,
            "province_code": r.code if r else None, "province": r.name if r else None,
            "data_origin": o.data_origin.value, "verification": o.verification_status.value,
            "score": None if not a or a.risk_score is None else float(a.risk_score),
            "level": a.risk_level.value if a else "INSUFFICIENT_DATA",
            "confidence": None if not a or a.data_quality_score is None else float(a.data_quality_score),
            "period_end": a.period_end.isoformat() if a else None,
        })
    return out


def _province_filter(rows, province):
    if province:
        rows = [r for r in rows if r["province_code"] == province]
    return rows


def _tally(rows):
    dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INSUFFICIENT_DATA": 0}
    for r in rows:
        dist[r["level"]] += 1
    scores = [r["score"] for r in rows if r["score"] is not None]
    confs = [r["confidence"] for r in rows if r["score"] is not None and r["confidence"] is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else None
    return {"distribution": dist, "assessed": len(scores), "avg_score": avg,
            "avg_confidence": round(sum(confs) / len(confs), 2) if confs else None,
            "level": classify(avg) if avg is not None else "INSUFFICIENT_DATA"}


@router.get("/map/provinces")
def map_provinces(db: Session = DB):
    """Ringkasan per provinsi (38) untuk peta."""
    names = {r.code: r.name for r in db.scalars(select(m.Region).where(m.Region.level == m.RegionLevel.PROVINCE))}
    by_code: dict[str, list] = {}
    for r in _rows(db):
        if r["province_code"]:
            by_code.setdefault(r["province_code"], []).append(r)
    out = []
    for code, name in sorted(names.items()):
        rows = by_code.get(code, [])
        out.append({"code": code, "name": name, "n_objects": len(rows), **_tally(rows),
                    "level": _tally(rows)["level"] if rows else "NO_DATA",
                    "objects": [{k: r[k] for k in ("id", "name", "category", "score", "level", "confidence")}
                                for r in sorted(rows, key=lambda r: -(r["score"] or -1))]})
    return out


@router.get("/reports/executive")
def executive(province: str | None = None, db: Session = DB):
    if province and not db.scalar(select(m.Region.id).where(m.Region.code == province)):
        raise HTTPException(404, "provinsi tidak dikenal")
    rows = _province_filter(_rows(db), province)
    scope = db.scalar(select(m.Region.name).where(m.Region.code == province)) if province else "Nasional"
    open_w = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    ids = {r["id"] for r in rows}
    for w in db.scalars(select(m.EarlyWarning).where(m.EarlyWarning.status.in_([m.WarningStatus.OPEN, m.WarningStatus.IN_REVIEW]))):
        if str(w.cultural_object_id) in ids:
            open_w[w.severity.value] += 1
    origins: dict[str, int] = {}
    for r in rows:
        origins[r["data_origin"]] = origins.get(r["data_origin"], 0) + 1
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(), "scope": scope, "province": province,
        "total_objects": len(rows), **_tally(rows),
        "open_warnings": open_w, "data_origins": origins, "method_version": METHOD_VERSION, "method_params": PARAMS,
        "caveats": CAVEATS,
        "objects": sorted(rows, key=lambda r: -(r["score"] if r["score"] is not None else -1)),
    }


def _safe(v):
    """Cegah CSV/formula injection di Excel/Sheets untuk teks yang berasal dari impor pengguna."""
    return "'" + v if isinstance(v, str) and v[:1] in ("=", "+", "-", "@", "\t", "\r") else v


def _csv(filename: str, header: list[str], rows: list[list]):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    w.writerows([[_safe(c) for c in r] for r in rows])
    return Response("﻿" + buf.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/reports/objects.csv")
def objects_csv(province: str | None = None, db: Session = DB):
    rows = _province_filter(_rows(db), province)
    return _csv("ncri-objek-risiko.csv",
                ["kode", "objek", "kategori", "provinsi", "skor_risiko", "tingkat_risiko", "data_confidence",
                 "periode_s_d", "asal_data", "verifikasi", "metode"],
                [[r["external_code"], r["name"], r["category"], r["province"], r["score"], r["level"], r["confidence"],
                  r["period_end"], r["data_origin"], r["verification"], METHOD_VERSION]
                 for r in rows])


@router.get("/reports/early-warnings.csv")
def warnings_csv(db: Session = DB):
    origin = {o.id: o for o in db.scalars(select(m.CulturalObject))}
    ws = db.scalars(select(m.EarlyWarning).order_by(m.EarlyWarning.created_at.desc())).all()
    return _csv("ncri-early-warning.csv",
                ["objek", "tingkat", "judul", "deskripsi", "status", "asal_data", "dibuat"],
                [[w.cultural_object.name, w.severity.value, w.title, w.description, w.status.value,
                  origin[w.cultural_object_id].data_origin.value, w.created_at.isoformat()] for w in ws])
