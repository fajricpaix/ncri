import asyncio

import httpx
import pytest

from app.llm.guardrails import validate
from app.llm.provider import AnthropicProvider, FakeProvider, LLMError
from app.llm.schemas import LLMOutput

PAYLOAD = {
    "object": {"name": "Tari X", "data_origin": "SIMULATED"},
    "assessment": {"risk_score": 80.0, "risk_level": "HIGH", "data_confidence": 0.5, "factors": [
        {"indicator_name": "Pelaku", "change_pct": -40, "contribution": 20.0, "evidence_observation_ids": ["o1", "o2"]}]},
}
ALLOWED = {"o1", "o2"}


def out(**kw):
    base = {"summary": "s", "limitations": ["data terbatas"]}
    return LLMOutput.model_validate({**base, **kw})


def driver(refs):
    return {"factor": "f", "evidence_refs": refs, "interpretation": "i", "confidence": "low"}


def test_fabricated_evidence_ref_is_rejected():
    _, errors = validate(out(risk_drivers=[driver(["o1", "karangan"])]), ALLOWED, "RISK_EXPLANATION")
    assert any("karangan" in e for e in errors)


def test_claim_without_evidence_or_without_limitations_is_rejected():
    _, e1 = validate(out(risk_drivers=[driver([])]), ALLOWED, "RISK_EXPLANATION")
    _, e2 = validate(out(risk_drivers=[driver(["o1"])], limitations=[]), ALLOWED, "RISK_EXPLANATION")
    assert any("evidence" in e for e in e1) and any("limitations" in e for e in e2)


def test_hypotheses_are_always_flagged_for_validation():
    o = out(root_cause_hypotheses=[{"hypothesis": "h", "confidence": "low", "validation_needed": False}])
    o, errors = validate(o, ALLOWED, "ROOT_CAUSE")
    assert not errors and o.root_cause_hypotheses[0].validation_needed is True


def test_fake_provider_output_passes_guardrails_for_every_type():
    raw = asyncio.run(FakeProvider().generate_structured("", PAYLOAD, {}))
    for kind in ("RISK_EXPLANATION", "ROOT_CAUSE", "RECOMMENDATION"):
        _, errors = validate(LLMOutput.model_validate(raw), ALLOWED, kind)
        assert not errors, (kind, errors)
    assert "bukan analisis AI" in raw["summary"]  # tidak menyamar sebagai AI sungguhan


def _anthropic(handler):
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return AnthropicProvider("k", "claude-sonnet-5-5", client=client)


def test_anthropic_provider_sends_tool_schema_and_parses_tool_use():
    seen = {}

    def handler(req):
        seen["h"], seen["b"] = req.headers, __import__("json").loads(req.content)
        return httpx.Response(200, json={"content": [{"type": "tool_use", "name": "submit_analysis", "input": {"summary": "ok"}}]})

    got = asyncio.run(_anthropic(handler).generate_structured("sys", {"a": 1}, {"type": "object"}))
    assert got == {"summary": "ok"}
    assert seen["h"]["x-api-key"] == "k" and seen["b"]["tool_choice"]["name"] == "submit_analysis"
    assert seen["b"]["system"] == "sys" and seen["b"]["model"] == "claude-sonnet-5-5"


def test_anthropic_provider_errors_do_not_leak_key():
    with pytest.raises(LLMError) as e:
        asyncio.run(_anthropic(lambda r: httpx.Response(500)).generate_structured("s", {}, {}))
    assert "k" != str(e.value) and "x-api-key" not in str(e.value)


# ---- asisten tanya-jawab ----
from app.llm.guardrails import validate_assistant
from app.llm.schemas import AssistantOutput

A_PAYLOAD = {"task": "assistant", "question": "objek apa paling berisiko?", "scope": {"type": "national", "name": "Nasional"},
             "objects": [{"ref": "assessment:o1", "name": "X", "score": 90.0, "level": "HIGH", "data_confidence": 0.5,
                          "data_origin": "SIMULATED", "top_factors": []}]}


def ans(**kw):
    return AssistantOutput.model_validate({"answer": "a", "limitations": ["terbatas"], **kw})


def test_assistant_rejects_fabricated_or_missing_evidence():
    _, e1 = validate_assistant(ans(evidence_refs=["assessment:karangan"]), {"assessment:o1"})
    _, e2 = validate_assistant(ans(evidence_refs=[]), {"assessment:o1"})
    _, e3 = validate_assistant(ans(evidence_refs=["assessment:o1"], limitations=[]), {"assessment:o1"})
    assert e1 and e2 and e3
    assert not validate_assistant(ans(evidence_refs=["assessment:o1"]), {"assessment:o1"})[1]


def test_assistant_can_honestly_say_it_cannot_answer_without_evidence():
    _, errors = validate_assistant(ans(answerable=False, answer="data tidak cukup"), {"assessment:o1"})
    assert not errors


def test_fake_assistant_passes_guardrail_and_refuses_when_nothing_is_scored():
    raw = asyncio.run(FakeProvider().generate_structured("", A_PAYLOAD, {}))
    assert not validate_assistant(AssistantOutput.model_validate(raw), {"assessment:o1"})[1]
    empty = {**A_PAYLOAD, "objects": [{**A_PAYLOAD["objects"][0], "score": None}]}
    raw2 = asyncio.run(FakeProvider().generate_structured("", empty, {}))
    assert raw2["answerable"] is False and raw2["evidence_refs"] == []


def test_gemini_provider_sends_schema_in_header_auth_and_parses_json():
    from app.llm.provider import GeminiProvider
    seen = {}

    def handler(req):
        seen["h"], seen["b"], seen["url"] = req.headers, __import__("json").loads(req.content), str(req.url)
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": '{"summary": "ok"}'}]}}]})

    p = GeminiProvider("KUNCI", "gemini-2.5-flash", client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    assert asyncio.run(p.generate_structured("sys", {"a": 1}, {"type": "object"})) == {"summary": "ok"}
    assert seen["h"]["x-goog-api-key"] == "KUNCI" and "KUNCI" not in seen["url"]
    assert seen["b"]["generationConfig"]["responseJsonSchema"] == {"type": "object"}
    assert seen["b"]["systemInstruction"]["parts"][0]["text"] == "sys"


def test_gemini_errors_do_not_leak_key_and_explain_quota():
    from app.llm.provider import GeminiProvider
    p = GeminiProvider("RAHASIA", "m", client=httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(429, text="RAHASIA"))))
    with pytest.raises(LLMError) as e:
        asyncio.run(p.generate_structured("s", {}, {}))
    assert "RAHASIA" not in str(e.value) and "kuota" in str(e.value)


def test_api_key_is_encrypted_at_rest_and_db_setting_overrides_env():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app import models
    from app.llm import settings_store as store
    from app.llm.provider import GeminiProvider, get_provider
    eng = create_engine("sqlite://")
    models.AppSetting.__table__.create(eng)
    with Session(eng) as db:
        store.save(db, "gemini", None, "AIzaSECRET1234"); db.commit()
        assert "AIzaSECRET1234" not in db.get(models.AppSetting, "llm.api_key").value
        assert store.get_api_key(db) == "AIzaSECRET1234"
        p = get_provider(db)
        assert isinstance(p, GeminiProvider) and p.model == "gemini-2.5-flash" and p.api_key == "AIzaSECRET1234"
        store.save(db, "gemini", "gemini-2.5-pro", None); db.commit()      # ganti model, kunci lama tetap
        assert get_provider(db).api_key == "AIzaSECRET1234" and get_provider(db).model == "gemini-2.5-pro"
        store.clear(db); db.commit()
        assert store.get_api_key(db) is None
