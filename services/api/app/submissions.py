"""Data Submission berbantuan AI: cari -> staging (PENDING) -> verifikasi reviewer -> tabel utama (tampil di dashboard)."""
import hashlib
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app import auth, models as m
from app.db import get_db
from app.llm import discovery
from app.llm.provider import LLMError, get_provider
from app.llm.routes import rate_limit

router = APIRouter(dependencies=[Depends(auth.current_user)])
DB = Depends(get_db)


class DiscoveryIn(BaseModel):
    query: str = Field(min_length=3, max_length=200)
    region_code: str | None = None


class ApproveIn(BaseModel):
    payload: dict | None = None  # koreksi reviewer; field yang dikirim menimpa hasil AI


class RejectIn(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class SubmissionOut(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    kind: str
    payload: dict
    evidence_text: str
    sources: list
    query: str
    provider: str
    model: str
    status: str
    created_at: datetime
    reviewed_at: datetime | None
    review_note: str | None
    result_id: uuid.UUID | None


def _out(r: m.AiSubmission) -> SubmissionOut:
    return SubmissionOut(id=r.id, batch_id=r.batch_id, kind=r.kind.value, payload=r.payload, evidence_text=r.evidence_text,
                         sources=r.sources, query=r.query, provider=r.provider, model=r.model, status=r.status.value,
                         created_at=r.created_at, reviewed_at=r.reviewed_at, review_note=r.review_note, result_id=r.result_id)


@router.post("/llm/discovery", dependencies=[Depends(rate_limit)])
async def run_discovery(body: DiscoveryIn, user: m.User = auth.ANALYST, db: Session = DB):
    try:
        batch, rows, dropped = await discovery.discover(db, get_provider(db), user, body.query.strip(), body.region_code)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except LLMError as e:
        raise HTTPException(503, str(e))
    except discovery.NoEvidence:  # 200, bukan 404: 404 dipakai untuk "endpoint tidak ada"
        return {"batch_id": None, "created": [], "dropped": [], "no_evidence": True}
    auth.audit(db, user, "ai.discovery", "ai_submission", batch, {"query": body.query, "created": len(rows), "dropped": len(dropped)})
    db.commit()
    for r in rows:
        db.refresh(r)
    return {"batch_id": batch, "created": [_out(r) for r in rows], "dropped": dropped}


@router.get("/submissions", response_model=list[SubmissionOut])
def list_submissions(status: m.SubmissionStatus | None = None, limit: int = 200, db: Session = DB):
    q = select(m.AiSubmission).order_by(m.AiSubmission.created_at.desc()).limit(min(limit, 500))
    if status:
        q = q.where(m.AiSubmission.status == status)
    return [_out(r) for r in db.scalars(q)]


def _pending(db: Session, id: uuid.UUID) -> m.AiSubmission:
    row = db.scalar(select(m.AiSubmission).where(m.AiSubmission.id == id).with_for_update())
    if not row:
        raise HTTPException(404, "submission tidak ditemukan")
    if row.status != m.SubmissionStatus.PENDING:
        raise HTTPException(409, f"sudah {row.status.value}")
    return row


def _source(db: Session, row: m.AiSubmission) -> m.DataSource:
    """Sumber = sitasi pertama hasil pencarian; kode deterministik per URL (idempoten)."""
    src = row.sources[0]
    code = "WEB-" + hashlib.sha1(src["url"].encode()).hexdigest()[:10]
    obj = db.scalar(select(m.DataSource).where(m.DataSource.code == code))
    if not obj:
        obj = m.DataSource(code=code, name=(src.get("title") or urlparse(src["url"]).netloc or code)[:200],
                           source_type=m.SourceType.PUBLIC_DATA, terms_url=src["url"], access_method="WEB_SEARCH_AI",
                           description="Ditemukan lewat pencarian web AI dan diverifikasi reviewer.")
        db.add(obj)
        db.flush()
    return obj


def _find_object(db: Session, name: str, region_id) -> m.CulturalObject | None:
    return db.scalar(select(m.CulturalObject).where(func.lower(m.CulturalObject.name) == name.strip().lower(),
                                                    m.CulturalObject.region_id == region_id))


@router.post("/submissions/{id}/approve", response_model=SubmissionOut)
def approve(id: uuid.UUID, body: ApproveIn | None = None, user: m.User = auth.REVIEWER, db: Session = DB):
    row = _pending(db, id)
    data = {**row.payload, **((body.payload if body else None) or {})}
    try:
        item = (discovery.ObjectItem if row.kind == m.SubmissionKind.OBJECT else discovery.ObservationItem) \
            .model_validate({**data, "evidence_id": "-"})
    except Exception:
        raise HTTPException(422, "payload koreksi tidak valid")
    region = db.scalar(select(m.Region).where(m.Region.code == item.region_code))
    if not region:
        raise HTTPException(422, "provinsi tidak dikenal")
    src = _source(db, row)
    if row.kind == m.SubmissionKind.OBJECT:
        if _find_object(db, item.name, region.id):
            raise HTTPException(409, "objek dengan nama dan provinsi itu sudah ada")
        obj = m.CulturalObject(external_code="AI-" + str(row.id)[:8], name=item.name.strip(), category=item.category.strip(),
                               description=item.description, region_id=region.id, source_id=src.id,
                               data_origin=m.Origin.PUBLIC, verification_status=m.Verification.VERIFIED)
        db.add(obj)
        db.flush()
        row.result_id = obj.id
    else:
        obj = _find_object(db, item.object_name, region.id)
        if not obj:
            raise HTTPException(409, "objek belum ada di database: setujui item objeknya dulu")
        ind = db.scalar(select(m.Indicator).where(m.Indicator.code == item.indicator_code))
        if not ind:
            raise HTTPException(422, "indikator tidak dikenal")
        vals = dict(cultural_object_id=obj.id, indicator_id=ind.id, period_start=item.period_start, period_end=item.period_end,
                    value_numeric=item.value_numeric, source_id=src.id, data_origin=m.Origin.PUBLIC,
                    verification_status=m.Verification.VERIFIED, notes=row.evidence_text[:500])
        stmt = insert(m.IndicatorObservation).values(**vals)
        row.result_id = db.execute(stmt.on_conflict_do_update(
            index_elements=["cultural_object_id", "indicator_id", "period_start", "period_end", "source_id"],
            set_={"value_numeric": stmt.excluded.value_numeric, "verification_status": m.Verification.VERIFIED,
                  "notes": stmt.excluded.notes}).returning(m.IndicatorObservation.id)).scalar_one()
    row.payload = item.model_dump(mode="json", exclude={"evidence_id"})  # simpan versi final (setelah koreksi reviewer)
    row.status, row.reviewed_by, row.reviewed_at = m.SubmissionStatus.APPROVED, user.id, datetime.now(timezone.utc)
    auth.audit(db, user, "ai.submission.approve", "ai_submission", row.id, {"kind": row.kind.value, "result_id": str(row.result_id)})
    db.commit()
    return _out(row)


@router.post("/submissions/{id}/reject", response_model=SubmissionOut)
def reject(id: uuid.UUID, body: RejectIn | None = None, user: m.User = auth.REVIEWER, db: Session = DB):
    row = _pending(db, id)
    row.status, row.reviewed_by, row.reviewed_at = m.SubmissionStatus.REJECTED, user.id, datetime.now(timezone.utc)
    row.review_note = body.note if body else None
    auth.audit(db, user, "ai.submission.reject", "ai_submission", row.id, {"kind": row.kind.value})
    db.commit()
    return _out(row)
