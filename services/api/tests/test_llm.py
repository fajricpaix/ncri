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
