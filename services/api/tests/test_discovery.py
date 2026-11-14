import asyncio
import json

import httpx
import pytest

from app.llm.discovery import DiscoveryOutput, NoEvidence, build_evidence, number_in_text, validate_output
from app.llm.provider import AnthropicProvider, FakeProvider, GeminiProvider, LLMError

EV = {"e1": {"id": "e1", "text": "Tari Saman di Aceh dikuasai 1.250 penari aktif pada 2023.", "sources": [{"url": "https://x.id", "title": "x"}]}}


@pytest.mark.parametrize("value,text,ok", [
    (1250, "ada 1.250 penari", True), (1250, "ada 1,250 penari", True), (1250, "ada 1250 penari", True),
    (12.5, "sekitar 12,5 persen", True), (12.5, "sekitar 12.5 persen", True),
    (1250, "ada 125 penari", False), (2023, "pada 2023.", True), (50, "ada 5 dan 500", False)])
def test_number_in_text(value, text, ok):
    assert number_in_text(value, text) is ok


def out(**kw):
    return DiscoveryOutput.model_validate(kw)


def obs(**over):
    base = dict(evidence_id="e1", object_name="Tari Saman", region_code="11", indicator_code="PRACTITIONERS",
                period_start="2023-01-01", period_end="2023-12-31", value_numeric=1250)
    return {**base, **over}


def run(o):
    return validate_output(o, EV, {"11"}, {"PRACTITIONERS"}, set())


def test_valid_object_and_observation_pass():
    kept, dropped = run(out(objects=[dict(evidence_id="e1", name="Tari Saman", category="Tari", region_code="11")],
                            observations=[obs()]))
    assert [k[0] for k in kept] == ["OBJECT", "OBSERVATION"] and not dropped
    assert "evidence_id" not in kept[0][1]  # sumber/bukti tidak dibawa dari output model


@pytest.mark.parametrize("over,why", [
    ({"value_numeric": 9999}, "angka"), ({"evidence_id": "e9"}, "evidence_id"), ({"region_code": "99"}, "provinsi"),
    ({"indicator_code": "NGARANG"}, "indikator"), ({"period_end": "2022-01-01"}, "period_end")])
def test_fabricated_observation_is_dropped(over, why):
    kept, dropped = run(out(observations=[obs(**over)]))
    assert not kept and why in dropped[0]


def test_object_name_must_appear_in_evidence_and_duplicates_dropped():
    o = out(objects=[dict(evidence_id="e1", name="Reog Ponorogo", category="Tari", region_code="11"),
                     dict(evidence_id="e1", name="Tari Saman", category="Tari", region_code="11")])
    kept, dropped = validate_output(o, EV, {"11"}, set(), {("tari saman", "11")})
    assert not kept and "tidak tertulis" in dropped[0] and "sudah ada" in dropped[1]


def test_build_evidence_ids():
    assert [e["id"] for e in build_evidence([{"text": t, "sources": [{"url": "https://x.id", "title": ""}]} for t in "ab"])] == ["e1", "e2"]


def _client(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_gemini_search_takes_sources_from_grounding_only():
    def handler(req):
        assert json.loads(req.content)["tools"] == [{"google_search": {}}]
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "a b"}]}, "groundingMetadata": {
            "groundingChunks": [{"web": {"uri": "https://g/r1", "title": "kemdikbud.go.id"}}],
            "groundingSupports": [{"segment": {"text": "Tari Saman 1.250 penari"}, "groundingChunkIndices": [0]},
                                  {"segment": {"text": "tanpa sumber"}, "groundingChunkIndices": []}]}}]})
    segs = asyncio.run(GeminiProvider("k", "m", client=_client(handler)).search("s", "q"))
    assert segs == [{"text": "Tari Saman 1.250 penari", "sources": [{"url": "https://g/r1", "title": "kemdikbud.go.id"}]}]


def test_anthropic_search_uses_citations_only():
    def handler(req):
        assert json.loads(req.content)["tools"][0]["type"].startswith("web_search")
        return httpx.Response(200, json={"content": [
            {"type": "text", "text": "tanpa sitasi"},
            {"type": "text", "text": "Reog 500 penari", "citations": [{"url": "https://a.id", "title": "A"}]}]})
    segs = asyncio.run(AnthropicProvider("k", "m", client=_client(handler)).search("s", "q"))
    assert segs == [{"text": "Reog 500 penari", "sources": [{"url": "https://a.id", "title": "A"}]}]


def test_search_http_error_and_fake_provider_refuse():
    with pytest.raises(LLMError, match="429"):
        asyncio.run(GeminiProvider("k", "m", client=_client(lambda r: httpx.Response(429))).search("s", "q"))
    with pytest.raises(LLMError, match="tidak mengarang"):
        asyncio.run(FakeProvider().search("s", "q"))


def test_no_evidence_is_an_error_type():
    assert issubclass(NoEvidence, Exception)


def test_non_http_source_urls_are_dropped():
    segs = [{"text": "a", "sources": [{"url": "javascript:alert(1)", "title": "x"}]},
            {"text": "b", "sources": [{"url": "javascript:x", "title": ""}, {"url": "https://ok.id", "title": "ok"}]}]
    ev = build_evidence(segs)
    assert [(e["id"], e["sources"]) for e in ev] == [("e1", [{"url": "https://ok.id", "title": "ok"}])]


def test_provider_error_shows_upstream_message():
    body = {"error": {"type": "invalid_request_error", "message": "tools.0: schema tidak valid"}}
    with pytest.raises(LLMError, match="HTTP 400: tools.0: schema tidak valid"):
        asyncio.run(AnthropicProvider("k", "m", client=_client(lambda r: httpx.Response(400, json=body)))
                    .generate_structured("s", {}, {}))
