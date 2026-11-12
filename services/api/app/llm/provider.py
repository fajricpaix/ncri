import json
from typing import Any, Protocol

import httpx

from app.config import settings


class LLMError(Exception):
    pass


class LLMProvider(Protocol):
    name: str
    model: str

    async def generate_structured(self, system_prompt: str, user_payload: dict[str, Any],
                                  response_schema: dict[str, Any]) -> dict[str, Any]: ...


class AnthropicProvider:
    name = "anthropic"
    URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str, timeout: float = 60.0, client: httpx.AsyncClient | None = None):
        self.api_key, self.model, self.timeout = api_key, model, timeout
        self._client = client

    async def generate_structured(self, system_prompt, user_payload, response_schema):
        body = {
            "model": self.model, "max_tokens": 4000, "system": system_prompt,
            "messages": [{"role": "user", "content": json.dumps(user_payload, ensure_ascii=False, default=str)}],
            "tools": [{"name": "submit_analysis", "description": "Kirim hasil analisis terstruktur",
                       "input_schema": response_schema}],
            "tool_choice": {"type": "tool", "name": "submit_analysis"},
        }
        headers = {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        try:
            if self._client:
                r = await self._client.post(self.URL, json=body, headers=headers)
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as c:
                    r = await c.post(self.URL, json=body, headers=headers)
            r.raise_for_status()
        except httpx.HTTPError as e:
            raise LLMError(f"provider error: {type(e).__name__}") from e
        for block in r.json().get("content", []):
            if block.get("type") == "tool_use":
                return block["input"]
        raise LLMError("provider tidak mengembalikan output terstruktur")


class FakeProvider:
    """Keluaran deterministik dari payload, tanpa jaringan. HANYA untuk dev/tes; bukan analisis AI."""
    name = "fake"
    model = "deterministic-v1"
    TAG = "[CONTOH DETERMINISTIK, bukan analisis AI] "

    async def generate_structured(self, system_prompt, user_payload, response_schema):
        a = user_payload["assessment"]
        top = a["factors"][:3]
        drivers = [{"factor": f["indicator_name"], "evidence_refs": f["evidence_observation_ids"],
                    "interpretation": f"{f['indicator_name']} berubah {f['change_pct']:+.0f}% dibanding periode setara sebelumnya "
                                      f"(kontribusi {f['contribution']:.1f} poin).", "confidence": "medium"} for f in top]
        hyps = [{"hypothesis": f"Penurunan {f['indicator_name']} mungkin terkait terbatasnya kesempatan regenerasi atau kegiatan rutin.",
                 "supporting_evidence": f["evidence_observation_ids"],
                 "missing_evidence": ["Penyebab lokal belum didokumentasikan (survei komunitas)"],
                 "confidence": "low", "validation_needed": True} for f in top]
        actions = [{"action": f"Prioritaskan intervensi untuk memulihkan {f['indicator_name']}.",
                    "target_group": "Komunitas pelaku dan calon penerus", "suggested_kpis": [f"Pemulihan {f['indicator_name']} ≥ nilai periode sebelumnya"],
                    "time_horizon": "6-12 bulan", "evidence_refs": f["evidence_observation_ids"]} for f in top[:2]]
        limits = ["Contoh deterministik dari penyedia 'fake'; bukan hasil model AI."]
        if user_payload["object"]["data_origin"] == "SIMULATED":
            limits.append("Seluruh data berstatus SIMULATED.")
        if (a["data_confidence"] or 0) < 0.6:
            limits.append(f"Data confidence rendah ({a['data_confidence']}).")
        return {"summary": f"{self.TAG}Skor risiko {a['risk_score']:.0f}/100 ({a['risk_level']}) untuk {user_payload['object']['name']}.",
                "risk_drivers": drivers, "root_cause_hypotheses": hyps, "recommended_actions": actions, "limitations": limits}


def get_provider() -> LLMProvider:
    p = settings.llm_provider.lower()
    if p == "fake":
        return FakeProvider()
    if p == "anthropic":
        if not settings.llm_api_key:
            raise LLMError("LLM_API_KEY belum diisi")
        return AnthropicProvider(settings.llm_api_key, settings.llm_model, settings.llm_timeout_seconds)
    raise LLMError("LLM belum dikonfigurasi (set LLM_PROVIDER)")
