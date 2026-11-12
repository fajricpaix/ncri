import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app import models as m
from app import schemas as s
from app.config import settings
from app.db import get_db
from app import auth, risk_service
from app.importer import REQUIRED, parse_csv, validate_rows

public = APIRouter()  # tanpa login: health check & template CSV (tidak berisi data)
router = APIRouter(dependencies=[Depends(auth.current_user)])  # semua lainnya wajib login
DB = Depends(get_db)


@public.get("/health")
def health():
    return {"status": "ok", "service": "ncri-api"}


@router.get("/regions", response_model=list[s.RegionOut])
def regions(level: m.RegionLevel | None = None, db: Session = DB):
    q = select(m.Region).order_by(m.Region.code)
    if level:
        q = q.where(m.Region.level == level)
    return db.scalars(q).all()


@router.get("/indicators", response_model=list[s.IndicatorOut])
def indicators(db: Session = DB):
    return db.scalars(select(m.Indicator).order_by(m.Indicator.code)).all()


@router.get("/data-sources", response_model=list[s.DataSourceOut])
def list_sources(db: Session = DB):
    return db.scalars(select(m.DataSource).order_by(m.DataSource.code)).all()


@router.post("/data-sources", response_model=s.DataSourceOut, status_code=201)
def create_source(body: s.DataSourceIn, user: m.User = auth.ANALYST, db: Session = DB):
    if db.scalar(select(m.DataSource).where(m.DataSource.code == body.code)):
        raise HTTPException(409, "code sudah dipakai")
    obj = m.DataSource(**body.model_dump())
    db.add(obj)
    db.flush()
    auth.audit(db, user, "source.create", "data_source", obj.id)
    db.commit()
    return obj


@router.get("/cultural-objects", response_model=list[s.CulturalObjectOut])
def list_objects(q: str | None = None, region_id: uuid.UUID | None = None,
                 limit: int = 50, offset: int = 0, db: Session = DB):
    stmt = select(m.CulturalObject).order_by(m.CulturalObject.name)
    if q:
        stmt = stmt.where(m.CulturalObject.name.ilike(f"%{q}%"))
    if region_id:
        stmt = stmt.where(m.CulturalObject.region_id == region_id)
    return db.scalars(stmt.limit(min(limit, 200)).offset(offset)).all()


@router.post("/cultural-objects", response_model=s.CulturalObjectOut, status_code=201)
def create_object(body: s.CulturalObjectIn, user: m.User = auth.ANALYST, db: Session = DB):
    if body.external_code and db.scalar(select(m.CulturalObject).where(m.CulturalObject.external_code == body.external_code)):
        raise HTTPException(409, "external_code sudah dipakai")
    obj = m.CulturalObject(**body.model_dump())
    db.add(obj)
    db.flush()
    auth.audit(db, user, "object.create", "cultural_object", obj.id, {"data_origin": body.data_origin.value})
    db.commit()
    return obj


def _get_object(db: Session, id: uuid.UUID) -> m.CulturalObject:
    obj = db.get(m.CulturalObject, id)
    if not obj:
        raise HTTPException(404, "objek tidak ditemukan")
    return obj


@router.get("/cultural-objects/{id}", response_model=s.CulturalObjectOut)
def get_object(id: uuid.UUID, db: Session = DB):
    return _get_object(db, id)


@router.get("/cultural-objects/{id}/indicators", response_model=list[s.ObservationOut])
def object_indicators(id: uuid.UUID, db: Session = DB):
    _get_object(db, id)
    q = (select(m.IndicatorObservation).where(m.IndicatorObservation.cultural_object_id == id)
         .order_by(m.IndicatorObservation.period_start))
    return db.scalars(q).all()


@public.get("/data-imports/template.csv", response_class=PlainTextResponse)
def template():
    return ",".join(REQUIRED) + "\nOBJ-001,ACTIVE_PRACTITIONERS,2024-01-01,2024-12-31,45,SIM-01,SIMULATED\n"


@router.post("/data-imports/csv", response_model=s.ImportReport)
async def import_csv(file: UploadFile, commit: bool = False, user: m.User = auth.ANALYST, db: Session = DB):
    """commit=false: hanya validasi + preview. commit=true: simpan baris valid."""
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(415, "hanya file .csv")
    raw = await file.read(settings.max_upload_bytes + 1)
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(413, "file terlalu besar")
    try:
        rows, header_error = parse_csv(raw)
    except UnicodeDecodeError:
        raise HTTPException(400, "file harus UTF-8")
    if header_error:
        raise HTTPException(422, header_error)

    objects = {k: v for k, v in db.execute(select(m.CulturalObject.external_code, m.CulturalObject.id)) if k}
    inds = dict(db.execute(select(m.Indicator.code, m.Indicator.id)).all())
    srcs = dict(db.execute(select(m.DataSource.code, m.DataSource.id)).all())
    valid, errors = validate_rows(rows, set(objects), set(inds), set(srcs))
    report = dict(committed=False, records_total=len(rows), records_valid=len(valid),
                  records_failed=len({e["row"] for e in errors}), errors=errors[:200],
                  preview=[{k: str(v) for k, v in r.items()} for r in valid[:10]])
    if not commit:
        return report

    job = m.DataImportJob(file_name=file.filename, status=m.ImportStatus.PROCESSING,
                          records_total=len(rows), records_success=len(valid),
                          records_failed=report["records_failed"])
    db.add(job)
    db.flush()
    for r in valid:
        values = dict(cultural_object_id=objects[r["object_external_code"]], indicator_id=inds[r["indicator_code"]],
                      period_start=r["period_start"], period_end=r["period_end"], value_numeric=r["value_numeric"],
                      source_id=srcs[r["source_code"]], import_job_id=job.id, data_origin=r["data_origin"])
        stmt = insert(m.IndicatorObservation).values(**values)
        db.execute(stmt.on_conflict_do_update(
            index_elements=["cultural_object_id", "indicator_id", "period_start", "period_end", "source_id"],
            set_={"value_numeric": stmt.excluded.value_numeric, "import_job_id": job.id,
                  "data_origin": stmt.excluded.data_origin}))
    job.status = m.ImportStatus.COMPLETED
    job.finished_at = datetime.now(timezone.utc)
    if errors:
        job.error_summary = f"{report['records_failed']} baris ditolak"
    auth.audit(db, user, "import.csv", "data_import_job", job.id,
               {"file": file.filename, "success": len(valid), "failed": report["records_failed"]})
    db.commit()
    return {**report, "committed": True, "job_id": job.id}


@router.get("/data-imports/{id}")
def import_status(id: uuid.UUID, db: Session = DB):
    job = db.get(m.DataImportJob, id)
    if not job:
        raise HTTPException(404, "import tidak ditemukan")
    return {c: getattr(job, c) for c in ("id", "file_name", "status", "records_total",
                                         "records_success", "records_failed", "error_summary", "finished_at")}


# ---------- Risk analytics ----------

@router.post("/analytics/risk/run")
def run_risk(body: s.RiskRunIn, user: m.User = auth.ANALYST, db: Session = DB):
    if body.cultural_object_id:
        _get_object(db, body.cultural_object_id)
    return risk_service.run(db, body.cultural_object_id, user)


@router.get("/cultural-objects/{id}/risk", response_model=s.RiskOut)
def object_risk(id: uuid.UUID, db: Session = DB):
    _get_object(db, id)
    a = db.scalar(select(m.RiskAssessment).where(m.RiskAssessment.cultural_object_id == id)
                  .order_by(m.RiskAssessment.period_end.desc()).limit(1))
    if not a:
        raise HTTPException(404, "belum ada penilaian risiko; jalankan POST /analytics/risk/run")
    ex = a.explanation_json
    return s.RiskOut(
        cultural_object_id=id, assessment_date=a.assessment_date, period_start=a.period_start, period_end=a.period_end,
        risk_score=None if a.risk_score is None else float(a.risk_score), risk_level=a.risk_level.value,
        data_confidence=None if a.data_quality_score is None else float(a.data_quality_score),
        method_version=a.method_version, is_simulated=a.is_simulated, confidence_components=ex["confidence_components"],
        params=ex["params"],
        factors=[s.RiskFactorOut(indicator_code=f.indicator.code, indicator_name=f.indicator.name,
                                 normalized_risk=float(f.normalized_value), weight=float(f.weight_used),
                                 contribution=float(f.weighted_contribution), change_pct=float(f.change_pct),
                                 direction=f.direction, evidence_observation_ids=f.evidence_observation_ids)
                 for f in sorted(a.factors, key=lambda f: -f.weighted_contribution)])


@router.get("/early-warnings", response_model=list[s.WarningOut])
def list_warnings(status: m.WarningStatus | None = None, db: Session = DB):
    q = select(m.EarlyWarning).order_by(m.EarlyWarning.created_at.desc())
    if status:
        q = q.where(m.EarlyWarning.status == status)
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    rows = sorted(db.scalars(q).all(), key=lambda w: order[w.severity.value])
    return [s.WarningOut(id=w.id, cultural_object_id=w.cultural_object_id, object_name=w.cultural_object.name,
                         severity=w.severity.value, title=w.title, description=w.description,
                         status=w.status.value) for w in rows]


@router.patch("/early-warnings/{id}")
def update_warning(id: uuid.UUID, body: s.WarningPatch, user: m.User = auth.TRIAGE, db: Session = DB):
    w = db.get(m.EarlyWarning, id)
    if not w:
        raise HTTPException(404, "peringatan tidak ditemukan")
    w.status = body.status
    w.resolved_at = datetime.now(timezone.utc) if body.status in (m.WarningStatus.RESOLVED, m.WarningStatus.DISMISSED) else None
    auth.audit(db, user, "warning.update", "early_warning", id, {"status": body.status.value})
    db.commit()
    return {"id": id, "status": body.status.value}


@router.get("/dashboard/overview")
def overview(db: Session = DB):
    total = db.scalar(select(func.count()).select_from(m.CulturalObject))
    latest = risk_service.latest_assessments(db)
    dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INSUFFICIENT_DATA": 0}
    for a in latest:
        dist[a.risk_level.value] += 1
    dist["INSUFFICIENT_DATA"] += total - len(latest)  # belum pernah dinilai = data belum cukup
    confs = [float(a.data_quality_score) for a in latest if a.data_quality_score is not None]

    def comp(key):
        v = [a.explanation_json["confidence_components"][key] for a in latest]
        return round(sum(v) / len(v), 2) if v else None

    trend: dict = {}
    for a in db.scalars(select(m.RiskAssessment)):
        t = trend.setdefault(a.period_end.isoformat(), {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INSUFFICIENT_DATA": 0})
        t[a.risk_level.value] += 1

    objs = {o.id: o for o in db.scalars(select(m.CulturalObject))}
    regions = {r.id: r.name for r in db.scalars(select(m.Region))}
    ranked = sorted((a for a in latest if a.risk_score is not None), key=lambda a: -a.risk_score)[:10]
    warn = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for sev, n in db.execute(select(m.EarlyWarning.severity, func.count()).where(
            m.EarlyWarning.status.in_([m.WarningStatus.OPEN, m.WarningStatus.IN_REVIEW])).group_by(m.EarlyWarning.severity)):
        warn[sev.value] = n
    origins = dict(db.execute(select(m.CulturalObject.data_origin, func.count()).group_by(m.CulturalObject.data_origin)).all())
    return {
        "total_objects": total,
        "assessed_objects": total - dist["INSUFFICIENT_DATA"],
        "distribution": dist,
        "avg_confidence": round(sum(confs) / len(confs), 2) if confs else None,
        "is_simulated": bool(origins.get(m.Origin.SIMULATED)) or any(a.is_simulated for a in latest),
        "data_origins": {k.value: v for k, v in origins.items()},
        "trend": [{"period_end": k, **v} for k, v in sorted(trend.items())],
        "open_warnings": warn,
        "quality": {"completeness": comp("completeness"), "freshness": comp("freshness"),
                    "verification": comp("verification")},
        "priority": [{"id": str(a.cultural_object_id), "name": objs[a.cultural_object_id].name,
                      "province": regions.get(objs[a.cultural_object_id].region_id),
                      "score": float(a.risk_score), "level": a.risk_level.value,
                      "data_confidence": float(a.data_quality_score), "is_simulated": a.is_simulated} for a in ranked],
    }
