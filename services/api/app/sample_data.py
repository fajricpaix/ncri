"""Isi data contoh (SIMULATED) untuk SEMUA fitur ke database:  python -m app.sample_data [--yes]

Menambah (tidak menimpa): sumber, 61 objek budaya, ±2.100 observasi 2019–2024, riwayat import, penilaian risiko + faktor,
early warning (dengan status tinjauan bervariasi), analisis AI (penjelasan, akar masalah, rekomendasi; berstatus
draft/disetujui/ditolak), satu contoh penolakan guardrail, riwayat asisten, dan audit log.

Semua keluaran AI memakai provider `fake` sehingga berlabel "CONTOH DETERMINISTIK · bukan AI" di UI.
Idempoten: bila OBJ-101 sudah ada, tidak melakukan apa-apa. Di luar APP_ENV=development wajib `--yes`."""
import asyncio
import sys
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app import risk_service
from app.reports import _rows
from app.config import settings
from app.db import SessionLocal
from app.llm import orchestrator as orch
from app.llm.provider import FakeProvider
from app.sample_catalog import SOURCES, TRAINING, build, period

SOURCE_TYPE = {"GOVERNMENT": m.SourceType.GOVERNMENT, "SURVEY": m.SourceType.SURVEY,
               "COMMUNITY": m.SourceType.COMMUNITY, "PUBLIC_DATA": m.SourceType.PUBLIC_DATA}
QUESTIONS = [
    ("national", None, "Objek mana yang paling berisiko dan mengapa?"),
    ("province", "33", "Bagaimana kondisi budaya di Jawa Tengah?"),
    ("province", "51", "Apa yang perlu diprioritaskan di Bali?"),
    ("province", "92", "Bagaimana kondisi budaya di Papua Barat?"),   # tanpa objek => 'data tidak cukup'
    ("object", "TOP", "Kenapa skor risikonya tinggi?"),
]


class _BadProvider:
    """Contoh penolakan guardrail: mengarang referensi bukti. Hanya untuk memperlihatkan fitur di UI."""
    name, model = "fake-guardrail-demo", "sengaja-salah"

    async def generate_structured(self, *_):
        return {"summary": "Contoh keluaran yang mengarang bukti.", "limitations": ["contoh"], "risk_drivers": [
            {"factor": "Pelaku", "evidence_refs": ["00000000-0000-0000-0000-karangan"], "interpretation": "tanpa dasar", "confidence": "high"}]}


def _actor(db: Session):
    return db.scalar(select(m.User).where(m.User.role == m.Role.ADMIN, m.User.is_active).order_by(m.User.email))


def run(db: Session) -> dict:
    if db.scalar(select(m.CulturalObject.id).where(m.CulturalObject.external_code == "OBJ-101")):
        return {"skipped": "OBJ-101 sudah ada; data contoh sudah dimuat"}
    inds = {i.code: i for i in db.scalars(select(m.Indicator))}
    regions = {r.code: r for r in db.scalars(select(m.Region).where(m.Region.level == m.RegionLevel.PROVINCE))}
    if not inds or not regions:
        raise SystemExit("Referensi (provinsi/indikator) kosong: jalankan `python -m app.seed` dulu")
    admin = _actor(db)

    # 1) sumber
    sources = {s.code: s for s in db.scalars(select(m.DataSource))}
    for code, name, typ, desc in SOURCES:
        if code not in sources:
            sources[code] = m.DataSource(code=code, name=name, source_type=SOURCE_TYPE[typ], description=desc,
                                         access_method="CSV (simulasi)", license_notes="Dibuat internal; tidak berasal dari instansi mana pun")
            db.add(sources[code])
    db.flush()

    # 2) objek + observasi (+ riwayat import per sumber)
    objects, obs = build()
    primary = {}
    for o in obs:
        if not o["verified"] and o["indicator"] != TRAINING:
            primary.setdefault(o["object"], o["source"])
    cobj = {}
    for o in objects:
        src = sources[primary.get(o["code"], "SIM-DAPOBUD")]
        cobj[o["code"]] = m.CulturalObject(
            external_code=o["code"], name=o["name"], category=o["category"], region_id=regions[o["province"]].id,
            inventory_status="Tercatat" if o["verified"] else "Dalam verifikasi",
            verification_status=m.Verification.VERIFIED if o["verified"] else m.Verification.UNVERIFIED,
            data_origin=m.Origin.SIMULATED, source_id=src.id)
        db.add(cobj[o["code"]])
    db.flush()

    count_by_src: dict[str, int] = {}
    for o in obs:
        count_by_src[o["source"]] = count_by_src.get(o["source"], 0) + 1
    failed = {"SIM-DAPOBUD": 9, "SIM-SURVEI": 0, "SIM-KOMUNITAS": 4, "SIM-BPS": 2}
    jobs = {}
    for code, n in count_by_src.items():
        jobs[code] = m.DataImportJob(
            file_name=f"simulasi-{code.lower()[4:]}-2019-2024.csv", status=m.ImportStatus.COMPLETED, records_total=n + failed[code],
            records_success=n, records_failed=failed[code], finished_at=datetime.now(timezone.utc),
            error_summary=f"{failed[code]} baris ditolak (contoh simulasi)" if failed[code] else None)
        db.add(jobs[code])
    db.flush()
    for o in obs:
        start, end = period(o["year"])
        db.add(m.IndicatorObservation(
            cultural_object_id=cobj[o["object"]].id, indicator_id=inds[o["indicator"]].id, period_start=start, period_end=end,
            value_numeric=o["value"], source_id=sources[o["source"]].id, import_job_id=jobs[o["source"]].id,
            verification_status=m.Verification.VERIFIED if o["verified"] else m.Verification.UNVERIFIED, data_origin=m.Origin.SIMULATED))
    for code, job in jobs.items():
        db.add(m.AuditLog(user_id=admin.id if admin else None, action="import.csv", entity_type="data_import_job", entity_id=job.id,
                          meta={"file": job.file_name, "success": job.records_success, "failed": job.records_failed, "sample": True}))
    db.commit()

    # 3) penilaian risiko + early warning (jalur kode yang sama dengan pemakaian nyata)
    new_ids = [c.id for c in cobj.values()]
    before = set(db.scalars(select(m.EarlyWarning.id)))
    risk = risk_service.run(db, None, admin, only_ids=new_ids)

    # 4) tinjauan early warning bervariasi (dilakukan atas nama admin bila ada)
    warnings = [w for w in db.scalars(select(m.EarlyWarning).order_by(m.EarlyWarning.created_at, m.EarlyWarning.id)) if w.id not in before]
    plan = [m.WarningStatus.IN_REVIEW, m.WarningStatus.RESOLVED, m.WarningStatus.OPEN, m.WarningStatus.OPEN,
            m.WarningStatus.DISMISSED, m.WarningStatus.OPEN, m.WarningStatus.IN_REVIEW]
    for i, w in enumerate(warnings):
        st = plan[i % len(plan)]
        if st == m.WarningStatus.OPEN:
            continue
        w.status = st
        if st in (m.WarningStatus.RESOLVED, m.WarningStatus.DISMISSED):
            w.resolved_at = datetime.now(timezone.utc)
        db.add(m.AuditLog(user_id=admin.id if admin else None, action="warning.update", entity_type="early_warning",
                          entity_id=w.id, meta={"status": st.value, "sample": True}))
    db.commit()

    # 5) analisis AI + asisten (provider fake) — butuh akun admin sebagai pelaku & pencatat tinjauan
    ai = {"analyses": 0, "recs": 0, "answers": 0, "guardrail_rejected": 0}
    if admin is None:
        return {"risk": risk, "warnings": len(warnings), "ai": "dilewati: tidak ada akun ADMIN aktif", **_counts(db)}
    prov = FakeProvider()
    top = sorted(((r["score"], r["id"]) for r in _rows(db) if r["external_code"] in cobj and r["score"] is not None), reverse=True)
    top_ids = [uuid.UUID(i) for _, i in top[:8]]

    async def generate():
        rows = {}
        for n, oid in enumerate(top_ids):
            rows[(oid, "EXPL")] = await orch.generate(db, prov, oid, "RISK_EXPLANATION", admin)
            if n < 6:
                rows[(oid, "ROOT")] = await orch.generate(db, prov, oid, "ROOT_CAUSE", admin)
            if n < 6:
                rows[(oid, "REC")] = await orch.generate(db, prov, oid, "RECOMMENDATION", admin)
        try:
            await orch.generate(db, _BadProvider(), top_ids[-1], "RISK_EXPLANATION", admin)
        except orch.InvalidOutput:
            ai["guardrail_rejected"] += 1
        for scope, sid, q in QUESTIONS:
            sid = str(top_ids[0]) if sid == "TOP" else sid
            await orch.ask(db, prov, scope, sid, q, admin)
            ai["answers"] += 1
        return rows

    rows = asyncio.run(generate())
    ai["analyses"] = len([k for k in rows if k[1] != "REC"])

    # 6) keputusan reviewer: sebagian disetujui, satu ditolak, sisanya draft (mengikuti perilaku endpoint review)
    def decide(row, decision):
        row.review_status = m.ReviewStatus(decision)
        orch.review(db, row, decision, admin)

    for n, oid in enumerate(top_ids[:6]):
        rec = db.scalar(select(m.PolicyRecommendation).where(m.PolicyRecommendation.llm_analysis_id == rows[(oid, "REC")].id))
        ai["recs"] += 1
        if n in (0, 1, 2):
            rec.status = m.RecStatus.APPROVED
            decide(rows[(oid, "REC")], "APPROVED")
            rec.reviewed_by, rec.reviewed_at = admin.id, datetime.now(timezone.utc)
        elif n == 3:
            rec.status = m.RecStatus.REJECTED
            decide(rows[(oid, "REC")], "REJECTED")
            rec.reviewed_by, rec.reviewed_at = admin.id, datetime.now(timezone.utc)
        elif n == 4:
            rec.status = m.RecStatus.UNDER_REVIEW
    for n, oid in enumerate(top_ids[:4]):
        decide(rows[(oid, "EXPL")], "APPROVED")
    decide(rows[(top_ids[4], "ROOT")], "REJECTED")
    db.commit()
    return {"risk": risk, "warnings": len(warnings), "ai": ai, **_counts(db)}


def _counts(db: Session) -> dict:
    tables = [m.CulturalObject, m.IndicatorObservation, m.DataSource, m.DataImportJob, m.RiskAssessment, m.EarlyWarning,
              m.LlmAnalysis, m.PolicyRecommendation, m.AuditLog]
    from sqlalchemy import func
    return {"totals": {t.__tablename__: db.scalar(select(func.count()).select_from(t)) for t in tables}}


def main():
    if settings.app_env != "development" and "--yes" not in sys.argv:
        sys.exit(f"APP_ENV={settings.app_env}: menambah data contoh SIMULATED ke database ini. Ulangi dengan --yes bila memang diinginkan.")
    with SessionLocal() as db:
        print(run(db))


if __name__ == "__main__":
    main()
