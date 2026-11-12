"""Bangun konteks bukti dari DB -> panggil LLM -> validasi -> simpan sebagai DRAFT."""
import uuid
from datetime import datetime, timezone

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.llm import guardrails
from app.llm.prompts import ASSISTANT_SYSTEM, PROMPT_VERSION, system_prompt
from app.llm.provider import LLMProvider
from app.llm.schemas import AssistantOutput, LLMOutput


class NoAssessment(Exception):
    pass


class InsufficientData(Exception):
    pass


class InvalidOutput(Exception):
    def __init__(self, analysis_id, errors):
        self.analysis_id, self.errors = analysis_id, errors


def build_context(db: Session, object_id: uuid.UUID):
    """Hanya agregat & observasi indikator: tanpa data pribadi."""
    obj = db.get(m.CulturalObject, object_id)
    a = db.scalar(select(m.RiskAssessment).where(m.RiskAssessment.cultural_object_id == object_id)
                  .order_by(m.RiskAssessment.period_end.desc()).limit(1))
    if not a:
        raise NoAssessment
    if a.risk_level == m.RiskLevel.INSUFFICIENT_DATA:
        raise InsufficientData
    obs = db.scalars(select(m.IndicatorObservation).where(m.IndicatorObservation.cultural_object_id == object_id)
                     .order_by(m.IndicatorObservation.period_start)).all()
    ind = {i.id: i for i in db.scalars(select(m.Indicator))}
    warnings = db.scalars(select(m.EarlyWarning).where(
        m.EarlyWarning.cultural_object_id == object_id,
        m.EarlyWarning.status.in_([m.WarningStatus.OPEN, m.WarningStatus.IN_REVIEW]))).all()
    payload = {
        "object": {"name": obj.name, "category": obj.category, "region": obj.region.name if obj.region else None,
                   "data_origin": obj.data_origin.value, "verification_status": obj.verification_status.value},
        "assessment": {
            "risk_score": float(a.risk_score), "risk_level": a.risk_level.value,
            "data_confidence": float(a.data_quality_score), "method_version": a.method_version,
            "confidence_components": a.explanation_json["confidence_components"],
            "period_start": a.period_start.isoformat(), "period_end": a.period_end.isoformat(),
            "is_simulated": a.is_simulated,
            "factors": [{"indicator_name": f.indicator.name, "indicator_code": f.indicator.code,
                         "normalized_risk": float(f.normalized_value), "weight": float(f.weight_used),
                         "contribution": float(f.weighted_contribution), "change_pct": float(f.change_pct),
                         "evidence_observation_ids": f.evidence_observation_ids}
                        for f in sorted(a.factors, key=lambda f: -f.weighted_contribution)]},
        "observations": [{"id": str(o.id), "indicator": ind[o.indicator_id].code,
                          "period_start": o.period_start.isoformat(), "period_end": o.period_end.isoformat(),
                          "value": None if o.value_numeric is None else float(o.value_numeric),
                          "verification_status": o.verification_status.value, "data_origin": o.data_origin.value}
                         for o in obs],
        "open_warnings": [{"title": w.title, "severity": w.severity.value} for w in warnings],
    }
    return obj, a, payload, {o["id"] for o in payload["observations"]}


async def generate(db: Session, provider: LLMProvider, object_id: uuid.UUID, analysis_type: str, user=None) -> m.LlmAnalysis:
    obj, assessment, payload, allowed = build_context(db, object_id)
    raw = await provider.generate_structured(system_prompt(analysis_type), payload, LLMOutput.model_json_schema())

    errors: list[str] = []
    out = None
    try:
        out, errors = guardrails.validate(LLMOutput.model_validate(raw), allowed, analysis_type)
    except ValidationError as e:
        errors = [f"output tidak sesuai schema: {len(e.errors())} masalah"]

    row = m.LlmAnalysis(
        created_by=user.id if user else None, cultural_object_id=object_id, risk_assessment_id=assessment.id, analysis_type=m.AnalysisType(analysis_type),
        provider=provider.name, model=provider.model, prompt_version=PROMPT_VERSION, input_snapshot=payload,
        output_json=out.model_dump() if out else raw, evidence_refs=guardrails.collect_refs(out) if out else [],
        validation_errors=errors, review_status=m.ReviewStatus.REJECTED if errors else m.ReviewStatus.DRAFT)
    db.add(row)
    db.flush()
    db.add(m.AuditLog(user_id=user.id if user else None, action=f"llm.{analysis_type.lower()}",
                      entity_type="llm_analysis", entity_id=row.id,
                      meta={"provider": provider.name, "model": provider.model, "rejected": bool(errors)}))
    if errors:
        db.commit()
        raise InvalidOutput(row.id, errors)
    if analysis_type == "RECOMMENDATION":
        db.add(m.PolicyRecommendation(
            cultural_object_id=object_id, risk_assessment_id=assessment.id, llm_analysis_id=row.id,
            title=f"Rekomendasi pelestarian: {obj.name}", problem_statement=out.summary,
            root_cause_hypotheses=[h.model_dump() for h in out.root_cause_hypotheses],
            recommended_actions=[a.model_dump() for a in out.recommended_actions],
            target_groups=sorted({a.target_group for a in out.recommended_actions}),
            suggested_kpis=sorted({k for a in out.recommended_actions for k in a.suggested_kpis}),
            evidence_refs=row.evidence_refs, created_by_type="LLM"))
    db.commit()
    return row


def review(db: Session, row, decision: str, user):
    """Persetujuan manusia; reviewer tercatat di baris dan di audit log."""
    row.reviewed_at = datetime.now(timezone.utc)
    row.reviewed_by = user.id
    db.add(m.AuditLog(user_id=user.id, action="llm.review", entity_type=type(row).__name__, entity_id=row.id,
                      meta={"decision": decision}))


MAX_OBJECTS = 25  # batasi ukuran konteks; terpotong ditandai pada payload


class BadScope(Exception):
    pass


def build_assistant_context(db: Session, scope_type: str, scope_id: str | None, question: str):
    from app.reports import _rows  # satu baris per objek: skor, level, provinsi, asal data

    rows = _rows(db)
    if scope_type == "object":
        rows = [r for r in rows if r["id"] == scope_id]
        if not rows:
            raise BadScope("objek tidak ditemukan")
        name = rows[0]["name"]
    elif scope_type == "province":
        rows = [r for r in rows if r["province_code"] == scope_id]
        name = rows[0]["province"] if rows else (scope_id or "")
        if not db.scalar(select(m.Region.id).where(m.Region.code == scope_id)):
            raise BadScope("provinsi tidak dikenal")
    elif scope_type == "national":
        name = "Nasional"
    else:
        raise BadScope("cakupan tidak valid")
    rows = sorted(rows, key=lambda r: -(r["score"] if r["score"] is not None else -1))
    truncated = len(rows) > MAX_OBJECTS
    rows = rows[:MAX_OBJECTS]

    ids = [uuid.UUID(r["id"]) for r in rows]
    latest = {a.cultural_object_id: a for a in db.scalars(
        select(m.RiskAssessment).where(m.RiskAssessment.cultural_object_id.in_(ids))
        .order_by(m.RiskAssessment.period_end))}  # urut naik: yang terakhir menimpa = terbaru
    objects = []
    for r in rows:
        a = latest.get(uuid.UUID(r["id"]))
        factors = [] if not a else [{"indicator_name": f.indicator.name, "change_pct": float(f.change_pct),
                                      "contribution": float(f.weighted_contribution),
                                      "evidence_observation_ids": f.evidence_observation_ids}
                                     for f in sorted(a.factors, key=lambda f: -f.weighted_contribution)[:3]]
        objects.append({"ref": f"assessment:{r['id']}", "name": r["name"], "category": r["category"],
                        "province": r["province"], "score": r["score"], "level": r["level"],
                        "data_confidence": r["confidence"], "data_origin": r["data_origin"], "top_factors": factors})
    payload = {"task": "assistant", "question": question, "scope": {"type": scope_type, "name": name},
               "objects": objects, "truncated": truncated, "observations": []}
    allowed = {o["ref"] for o in objects}
    if scope_type == "object":
        ind = {i.id: i for i in db.scalars(select(m.Indicator))}
        obs = db.scalars(select(m.IndicatorObservation).where(m.IndicatorObservation.cultural_object_id == ids[0])
                         .order_by(m.IndicatorObservation.period_start)).all()
        payload["observations"] = [{"id": str(o.id), "indicator": ind[o.indicator_id].code,
                                    "period_end": o.period_end.isoformat(), "value": None if o.value_numeric is None else float(o.value_numeric),
                                    "verification_status": o.verification_status.value} for o in obs]
        allowed |= {o["id"] for o in payload["observations"]}
    return payload, allowed


async def ask(db: Session, provider: LLMProvider, scope_type: str, scope_id: str | None, question: str, user) -> m.LlmAnalysis:
    payload, allowed = build_assistant_context(db, scope_type, scope_id, question)
    raw = await provider.generate_structured(ASSISTANT_SYSTEM, payload, AssistantOutput.model_json_schema())
    errors: list[str] = []
    out = None
    try:
        out, errors = guardrails.validate_assistant(AssistantOutput.model_validate(raw), allowed)
    except ValidationError as e:
        errors = [f"output tidak sesuai schema: {len(e.errors())} masalah"]
    obj_id = uuid.UUID(scope_id) if scope_type == "object" else None
    row = m.LlmAnalysis(
        created_by=user.id, cultural_object_id=obj_id, analysis_type=m.AnalysisType.ASSISTANT, provider=provider.name,
        model=provider.model, prompt_version=PROMPT_VERSION, input_snapshot=payload,
        output_json=out.model_dump() if out else raw, evidence_refs=sorted(set(out.evidence_refs)) if out else [],
        validation_errors=errors, review_status=m.ReviewStatus.REJECTED if errors else m.ReviewStatus.DRAFT)
    db.add(row)
    db.flush()
    db.add(m.AuditLog(user_id=user.id, action="llm.assistant", entity_type="llm_analysis", entity_id=row.id,
                      meta={"provider": provider.name, "scope": scope_type, "question_chars": len(question), "rejected": bool(errors)}))
    db.commit()
    if errors:
        raise InvalidOutput(row.id, errors)
    return row
