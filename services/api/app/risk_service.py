"""Glue DB <-> app.risk: jalankan penilaian dan simpan hasilnya beserta faktor & early warning."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.risk import METHOD_VERSION, Ind, Obs, assess, warnings_for


def _load(db: Session, object_ids: list):
    inds = [Ind(str(i.id), i.code, i.name, i.direction.value, float(i.default_weight))
            for i in db.scalars(select(m.Indicator).where(m.Indicator.is_active))]
    rows = db.scalars(select(m.IndicatorObservation).where(m.IndicatorObservation.cultural_object_id.in_(object_ids)))
    by_obj: dict = {oid: {} for oid in object_ids}
    for r in rows:
        by_obj[r.cultural_object_id].setdefault(str(r.indicator_id), []).append(
            Obs(str(r.id), r.period_start, r.period_end, None if r.value_numeric is None else float(r.value_numeric),
                r.verification_status == m.Verification.VERIFIED, str(r.source_id), r.created_at))
    return inds, by_obj


def run(db: Session, object_id=None, user=None, only_ids=None) -> dict:
    ids = list(only_ids) if only_ids else ([object_id] if object_id else list(db.scalars(select(m.CulturalObject.id))))
    inds, by_obj = _load(db, ids)
    today = date.today()
    written = created = 0
    for oid in ids:
        obs_by_ind = by_obj[oid]
        # as-of = tiap akhir periode yang punya >= 2 periode di belakangnya (untuk grafik tren)
        ends = sorted({o.period_end for l in obs_by_ind.values() for o in l})
        as_ofs = ends[1:] or ends[-1:]
        latest = None
        for as_of in as_ofs:
            a = assess(inds, obs_by_ind, as_of, today)
            for old in db.scalars(select(m.RiskAssessment).where(
                    m.RiskAssessment.cultural_object_id == oid, m.RiskAssessment.period_end == as_of,
                    m.RiskAssessment.method_version == METHOD_VERSION)):
                db.delete(old)  # lewat ORM supaya faktor ikut terhapus (cascade)
            db.flush()
            row = m.RiskAssessment(
                cultural_object_id=oid, assessment_date=today, period_start=a["period_start"], period_end=as_of,
                risk_score=a["risk_score"], risk_level=m.RiskLevel(a["risk_level"]), method_version=METHOD_VERSION,
                data_quality_score=a["data_confidence"],
                explanation_json={k: a[k] for k in ("confidence_components", "params", "indicators_available", "indicators_expected")},
                factors=[m.RiskAssessmentFactor(
                    indicator_id=f["indicator_id"], normalized_value=f["normalized_risk"], weight_used=f["weight"],
                    weighted_contribution=f["contribution"], direction=f["direction"], change_pct=f["change_pct"],
                    evidence_observation_ids=f["evidence_observation_ids"]) for f in a["factors"]])
            db.add(row)
            written += 1
            latest = (row, a)
        if latest:
            row, a = latest
            db.flush()
            for w in warnings_for(a):
                dup = db.scalar(select(m.EarlyWarning.id).where(
                    m.EarlyWarning.cultural_object_id == oid, m.EarlyWarning.title == w["title"],
                    m.EarlyWarning.status.in_([m.WarningStatus.OPEN, m.WarningStatus.IN_REVIEW])))
                if dup:
                    continue
                db.add(m.EarlyWarning(cultural_object_id=oid, risk_assessment_id=row.id,
                                      severity=m.Severity(w["severity"]), title=w["title"],
                                      description=w["description"], triggered_by_json=w["triggered_by"]))
                created += 1
    db.add(m.AuditLog(user_id=user.id if user else None, action="risk.run", entity_type="cultural_object",
                      entity_id=object_id, meta={"objects": len(ids), "assessments": written,
                                                 "warnings_created": created, "method_version": METHOD_VERSION}))
    db.commit()
    return {"objects": len(ids), "assessments_written": written, "warnings_created": created}


def latest_assessments(db: Session):
    """Penilaian terbaru (period_end terbesar) per objek."""
    q = (select(m.RiskAssessment).distinct(m.RiskAssessment.cultural_object_id)
         .order_by(m.RiskAssessment.cultural_object_id, m.RiskAssessment.period_end.desc()))
    return db.scalars(q).all()
