"""Validasi output LLM terhadap bukti yang benar-benar diberikan. LLM tidak boleh mengarang referensi."""
from app.llm.schemas import LLMOutput

NEED = {  # bagian output yang wajib terisi per jenis analisis
    "RISK_EXPLANATION": "risk_drivers",
    "ROOT_CAUSE": "root_cause_hypotheses",
    "RECOMMENDATION": "recommended_actions",
}


def validate(out: LLMOutput, allowed_ids: set[str], analysis_type: str) -> tuple[LLMOutput, list[str]]:
    """Return (output yang sudah dinormalisasi, daftar masalah). Daftar kosong = lolos."""
    errors = []
    if not getattr(out, NEED[analysis_type]):
        errors.append(f"bagian {NEED[analysis_type]} kosong")
    if not out.limitations:
        errors.append("limitations kosong (keterbatasan data wajib disebut)")

    def check(label, refs, required):
        unknown = [r for r in refs if r not in allowed_ids]
        if unknown:
            errors.append(f"{label}: referensi tidak ada di data yang diberikan: {unknown[:3]}")
        if required and not refs:
            errors.append(f"{label}: tidak punya evidence reference")

    for i, d in enumerate(out.risk_drivers):
        check(f"risk_drivers[{i}]", d.evidence_refs, True)
    for i, h in enumerate(out.root_cause_hypotheses):
        check(f"root_cause_hypotheses[{i}]", h.supporting_evidence, False)
        h.validation_needed = True  # hipotesis selalu perlu validasi, apa pun kata model
    for i, a in enumerate(out.recommended_actions):
        check(f"recommended_actions[{i}]", a.evidence_refs, True)
    return out, errors


def collect_refs(out: LLMOutput) -> list[str]:
    refs = {r for d in out.risk_drivers for r in d.evidence_refs}
    refs |= {r for h in out.root_cause_hypotheses for r in h.supporting_evidence}
    refs |= {r for a in out.recommended_actions for r in a.evidence_refs}
    return sorted(refs)
