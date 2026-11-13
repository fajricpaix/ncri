import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import auth, models as m
from app.config import settings
from app.db import get_db
from app.llm import orchestrator as orch
from app.llm import settings_store as store
from app.llm.provider import LLMError, get_provider
from app.ratelimit import Limiter

router = APIRouter(dependencies=[Depends(auth.current_user)])
DB = Depends(get_db)

rate_limit = Limiter(lambda: settings.llm_rate_per_minute, "terlalu banyak permintaan LLM, coba lagi sebentar")


class GenerateIn(BaseModel):
    cultural_object_id: uuid.UUID


class ReviewIn(BaseModel):
    decision: m.ReviewStatus  # APPROVED | REJECTED


class AnalysisOut(BaseModel):
    id: uuid.UUID
    analysis_type: str
    provider: str
    model: str
    prompt_version: str
    review_status: str
    output: dict
    evidence_refs: list[str]
    validation_errors: list[str]


class RecommendationOut(BaseModel):
    id: uuid.UUID
    cultural_object_id: uuid.UUID
    object_name: str
    title: str
    problem_statement: str
    root_cause_hypotheses: list
    recommended_actions: list
    target_groups: list
    suggested_kpis: list
    status: str
    provider: str | None


def _analysis_out(a: m.LlmAnalysis) -> AnalysisOut:
    return AnalysisOut(id=a.id, analysis_type=a.analysis_type.value, provider=a.provider, model=a.model,
                       prompt_version=a.prompt_version, review_status=a.review_status.value, output=a.output_json,
                       evidence_refs=a.evidence_refs, validation_errors=a.validation_errors)


async def _run(kind: str, body: GenerateIn, db: Session, user: m.User):
    if not db.get(m.CulturalObject, body.cultural_object_id):
        raise HTTPException(404, "objek tidak ditemukan")
    try:
        row = await orch.generate(db, get_provider(db), body.cultural_object_id, kind, user)
    except LLMError as e:
        raise HTTPException(503, str(e))
    except orch.NoAssessment:
        raise HTTPException(404, "belum ada penilaian risiko; jalankan POST /analytics/risk/run")
    except orch.InsufficientData:
        raise HTTPException(409, "data belum cukup (INSUFFICIENT_DATA): tidak ada yang bisa dianalisis")
    except orch.InvalidOutput as e:
        raise HTTPException(502, {"message": "output LLM ditolak guardrail", "analysis_id": str(e.analysis_id), "errors": e.errors})
    return _analysis_out(row)


@router.post("/llm/risk-explanation", response_model=AnalysisOut, dependencies=[Depends(rate_limit)])
async def risk_explanation(body: GenerateIn, user: m.User = auth.ANALYST, db: Session = DB):
    return await _run("RISK_EXPLANATION", body, db, user)


@router.post("/llm/root-cause", response_model=AnalysisOut, dependencies=[Depends(rate_limit)])
async def root_cause(body: GenerateIn, user: m.User = auth.ANALYST, db: Session = DB):
    return await _run("ROOT_CAUSE", body, db, user)


@router.post("/llm/recommendations", response_model=AnalysisOut, dependencies=[Depends(rate_limit)])
async def recommendations(body: GenerateIn, user: m.User = auth.ANALYST, db: Session = DB):
    return await _run("RECOMMENDATION", body, db, user)


@router.get("/cultural-objects/{id}/analyses", response_model=list[AnalysisOut])
def analyses(id: uuid.UUID, db: Session = DB):
    q = (select(m.LlmAnalysis).where(m.LlmAnalysis.cultural_object_id == id,
                                     m.LlmAnalysis.analysis_type != m.AnalysisType.ASSISTANT)
         .order_by(m.LlmAnalysis.created_at.desc()))
    return [_analysis_out(a) for a in db.scalars(q)]


@router.post("/llm/analyses/{id}/review")
def review_analysis(id: uuid.UUID, body: ReviewIn, user: m.User = auth.REVIEWER, db: Session = DB):
    a = db.get(m.LlmAnalysis, id)
    if not a:
        raise HTTPException(404, "analisis tidak ditemukan")
    if body.decision == m.ReviewStatus.DRAFT or a.review_status == m.ReviewStatus.REJECTED and a.validation_errors:
        raise HTTPException(409, "tidak bisa mengubah analisis yang ditolak guardrail")
    a.review_status = body.decision
    orch.review(db, a, body.decision.value, user)
    db.commit()
    return {"id": id, "review_status": a.review_status.value}


@router.get("/recommendations", response_model=list[RecommendationOut])
def list_recommendations(db: Session = DB):
    out = []
    for r in db.scalars(select(m.PolicyRecommendation).order_by(m.PolicyRecommendation.created_at.desc())):
        an = db.get(m.LlmAnalysis, r.llm_analysis_id) if r.llm_analysis_id else None
        out.append(RecommendationOut(
            id=r.id, cultural_object_id=r.cultural_object_id, object_name=r.cultural_object.name, title=r.title,
            problem_statement=r.problem_statement, root_cause_hypotheses=r.root_cause_hypotheses,
            recommended_actions=r.recommended_actions, target_groups=r.target_groups,
            suggested_kpis=r.suggested_kpis, status=r.status.value, provider=an.provider if an else None))
    return out


@router.post("/recommendations/{id}/review")
def review_recommendation(id: uuid.UUID, body: ReviewIn, user: m.User = auth.REVIEWER, db: Session = DB):
    r = db.get(m.PolicyRecommendation, id)
    if not r:
        raise HTTPException(404, "rekomendasi tidak ditemukan")
    if body.decision == m.ReviewStatus.DRAFT:
        raise HTTPException(422, "decision harus APPROVED atau REJECTED")
    r.status = m.RecStatus(body.decision.value)
    an = db.get(m.LlmAnalysis, r.llm_analysis_id) if r.llm_analysis_id else None
    if an:
        an.review_status = body.decision
    orch.review(db, r, body.decision.value, user)
    db.commit()
    return {"id": id, "status": r.status.value}


class AskIn(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    scope_type: str = "national"      # national | province | object
    scope_id: str | None = None       # kode provinsi atau id objek


class AnswerOut(BaseModel):
    id: uuid.UUID
    question: str
    scope: str
    answer: str
    answerable: bool
    evidence_refs: list[str]
    limitations: list[str]
    provider: str
    model: str


def _answer_out(a: m.LlmAnalysis) -> AnswerOut:
    o = a.output_json
    return AnswerOut(id=a.id, question=a.input_snapshot["question"], scope=a.input_snapshot["scope"]["name"],
                     answer=o["answer"], answerable=o.get("answerable", True), evidence_refs=a.evidence_refs,
                     limitations=o.get("limitations", []), provider=a.provider, model=a.model)


@router.post("/llm/assistant", response_model=AnswerOut, dependencies=[Depends(rate_limit)])
async def assistant(body: AskIn, user: m.User = auth.TRIAGE, db: Session = DB):
    try:
        row = await orch.ask(db, get_provider(db), body.scope_type, body.scope_id, body.question.strip(), user)
    except LLMError as e:
        raise HTTPException(503, str(e))
    except orch.BadScope as e:
        raise HTTPException(422, str(e))
    except orch.InvalidOutput as e:
        raise HTTPException(502, {"message": "jawaban LLM ditolak guardrail", "analysis_id": str(e.analysis_id), "errors": e.errors})
    return _answer_out(row)


@router.get("/llm/assistant/history", response_model=list[AnswerOut])
def assistant_history(user: m.User = auth.TRIAGE, db: Session = DB):
    """Hanya pertanyaan milik pengguna sendiri (pertanyaan bisa memuat hal sensitif)."""
    q = (select(m.LlmAnalysis).where(m.LlmAnalysis.analysis_type == m.AnalysisType.ASSISTANT,
                                     m.LlmAnalysis.created_by == user.id, m.LlmAnalysis.validation_errors == [])
         .order_by(m.LlmAnalysis.created_at.desc()).limit(20))
    return [_answer_out(a) for a in db.scalars(q)]


class LlmSettingsIn(BaseModel):
    provider: str = Field(pattern="^(gemini|anthropic)$")
    model: str | None = Field(default=None, max_length=100)
    api_key: str | None = Field(default=None, max_length=300)  # kosong = pertahankan kunci lama


def _settings_view(db: Session) -> dict:
    cfg = store.load(db)
    p = cfg["provider"] or settings.llm_provider
    saved = cfg["model"]
    model = (saved if saved in store.MODELS.get(p, []) else store.DEFAULT_MODEL.get(p)) if cfg["provider"] else settings.llm_model
    return {"provider": p, "model": model,
            "source": "database" if cfg["provider"] else "env",
            "api_key_set": bool(cfg["api_key"] or settings.llm_api_key),
            "api_key_hint": f"…{cfg['api_key'][-4:]}" if cfg["api_key"] else None,  # kunci tidak pernah dikirim balik
            "default_models": store.DEFAULT_MODEL, "models": store.MODELS,
            "updated_at": store.updated_at(db), "last_test": store.last_test(db)}


@router.get("/admin/llm-settings")
def get_llm_settings(_: m.User = auth.ADMIN, db: Session = DB):
    return _settings_view(db)


@router.put("/admin/llm-settings")
def put_llm_settings(body: LlmSettingsIn, admin: m.User = auth.ADMIN, db: Session = DB):
    if body.model and body.model not in store.MODELS[body.provider]:
        raise HTTPException(422, "model tidak ada di daftar untuk penyedia ini")
    if not body.api_key and not store.get_api_key(db):
        raise HTTPException(422, "API key wajib diisi")
    store.save(db, body.provider, (body.model or "").strip() or None, (body.api_key or "").strip() or None)
    auth.audit(db, admin, "llm.settings.update", "app_setting", None,
               {"provider": body.provider, "model": body.model, "api_key_changed": bool(body.api_key)})  # kunci tidak dicatat
    db.commit()
    return _settings_view(db)


@router.delete("/admin/llm-settings")
def reset_llm_settings(admin: m.User = auth.ADMIN, db: Session = DB):
    store.clear(db)
    auth.audit(db, admin, "llm.settings.clear", "app_setting")
    db.commit()
    return _settings_view(db)


@router.post("/admin/llm-settings/test", dependencies=[Depends(rate_limit)])
async def test_llm_settings(_: m.User = auth.ADMIN, db: Session = DB):
    """Satu panggilan kecil ke provider (tanpa data NCRI) untuk memastikan kunci & model valid. Hasilnya disimpan."""
    try:
        p = get_provider(db)
        if p.name == "fake":
            raise LLMError("belum ada penyedia nyata: pilih Gemini, isi API key, klik Simpan dulu, baru Tes koneksi")
        out = await p.generate_structured("Balas JSON {\"ok\": true}.", {"ping": "test"},
                                          {"type": "object", "properties": {"ok": {"type": "boolean"}}, "required": ["ok"]})
    except LLMError as e:
        store.record_test(db, False, str(e))
        db.commit()
        raise HTTPException(502, str(e))
    store.record_test(db, True, f"{p.name} / {p.model} merespons dengan benar")
    db.commit()
    return {"ok": True, "provider": p.name, "model": p.model, "reply": out}
