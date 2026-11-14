"""Skoring risiko baseline (rule-based, transparan). Fungsi murni: tanpa database.

Metode `baseline-0.1` — parameter di bawah adalah ASUMSI DEMO dan wajib divalidasi ahli.
Lihat docs/risk-methodology.md.
"""
from dataclasses import dataclass
from datetime import date, datetime

METHOD_VERSION = "baseline-0.1"
DECLINE_FOR_MAX_RISK = 50.0   # penurunan 50% antar periode setara => risiko 100
THRESHOLDS = {"HIGH": 70.0, "MEDIUM": 40.0}
MIN_INDICATORS = 3            # minimal indikator yang bisa dinilai
MIN_WEIGHT_COVERAGE = 0.6     # dan minimal 60% total bobot
PERIOD_TOLERANCE_DAYS = 10    # panjang periode harus setara (bukan bandingkan apel dengan jeruk)
FRESH_FULL_DAYS, FRESH_ZERO_DAYS = 365, 1460
SHARP_DROP_RISK = 80.0        # normalized >= 80 => sinyal anomali (penurunan >= 40%)
LOW_CONFIDENCE = 0.6

PARAMS = {"decline_for_max_risk_pct": DECLINE_FOR_MAX_RISK, "thresholds": THRESHOLDS,
          "min_indicators": MIN_INDICATORS, "min_weight_coverage": MIN_WEIGHT_COVERAGE,
          "period_tolerance_days": PERIOD_TOLERANCE_DAYS}


@dataclass(frozen=True)
class Obs:
    id: str
    period_start: date
    period_end: date
    value: float | None
    verified: bool
    source_id: str
    created_at: datetime


@dataclass(frozen=True)
class Ind:
    id: str
    code: str
    name: str
    direction: str  # LOWER_IS_WORSE | HIGHER_IS_WORSE
    weight: float


def _best_per_period(obs: list[Obs]) -> list[Obs]:
    """Satu observasi per periode: yang terverifikasi dulu, lalu yang terbaru. Nilai kosong = gap, dibuang."""
    best: dict[tuple, Obs] = {}
    for o in obs:
        if o.value is None:
            continue
        k = (o.period_start, o.period_end)
        cur = best.get(k)
        if cur is None or (o.verified, o.created_at) > (cur.verified, cur.created_at):
            best[k] = o
    return sorted(best.values(), key=lambda o: o.period_end)


def indicator_risk(obs: list[Obs], direction: str):
    """Return (risk 0-100, change_pct, prev, latest) atau None bila tidak bisa dibandingkan."""
    series = _best_per_period(obs)
    if len(series) < 2:
        return None
    prev, latest = series[-2], series[-1]
    len_prev = (prev.period_end - prev.period_start).days
    len_latest = (latest.period_end - latest.period_start).days
    if abs(len_prev - len_latest) > PERIOD_TOLERANCE_DAYS or prev.value == 0:
        return None
    change = (latest.value - prev.value) / abs(prev.value) * 100
    worse = -change if direction == "LOWER_IS_WORSE" else change
    risk = min(100.0, max(0.0, worse / DECLINE_FOR_MAX_RISK * 100))
    return risk, change, prev, latest


def classify(score: float) -> str:
    return "HIGH" if score >= THRESHOLDS["HIGH"] else "MEDIUM" if score >= THRESHOLDS["MEDIUM"] else "LOW"


def assess(inds: list[Ind], obs_by_ind: dict[str, list[Obs]], as_of: date, today: date) -> dict:
    weighted = [i for i in inds if i.weight > 0]
    total_w = sum(i.weight for i in weighted)
    found = []
    for i in weighted:
        r = indicator_risk([o for o in obs_by_ind.get(i.id, []) if o.period_end <= as_of], i.direction)
        if r:
            found.append((i, *r))

    covered = sum(i.weight for i, *_ in found) / total_w if total_w else 0.0
    used = [o for _, _, _, p, l in found for o in (p, l)]
    if used:
        age = (today - max(o.period_end for o in used)).days
        freshness = 1.0 if age <= FRESH_FULL_DAYS else max(0.0, 1 - (age - FRESH_FULL_DAYS) / (FRESH_ZERO_DAYS - FRESH_FULL_DAYS))
        verification = sum(o.verified for o in used) / len(used)
        sources = 1.0 if len({o.source_id for o in used}) >= 2 else 0.5
    else:
        freshness = verification = sources = 0.0
    components = {"completeness": covered, "freshness": freshness, "verification": verification, "sources": sources}
    confidence = round(sum(components.values()) / 4, 2)

    enough = len(found) >= MIN_INDICATORS and covered >= MIN_WEIGHT_COVERAGE
    found_w = sum(i.weight for i, *_ in found)
    factors, score = [], None
    if enough:
        score = 0.0
        for i, risk, change, prev, latest in found:
            w = i.weight / found_w  # bobot dinormalisasi ulang atas indikator yang tersedia
            score += risk * w
            factors.append({"indicator_id": i.id, "indicator_code": i.code, "indicator_name": i.name,
                            "normalized_risk": round(risk, 2), "weight": round(w, 4),
                            "contribution": round(risk * w, 2), "change_pct": round(change, 2),
                            "direction": i.direction, "evidence_observation_ids": [prev.id, latest.id]})
        score = round(score, 2)

    all_obs = [o for l in obs_by_ind.values() for o in l]
    return {
        "risk_score": score,
        "risk_level": classify(score) if score is not None else "INSUFFICIENT_DATA",
        "data_confidence": confidence,
        "confidence_components": {k: round(v, 2) for k, v in components.items()},
        "factors": factors,
        "indicators_available": len(found),
        "indicators_expected": len(weighted),
        "period_start": min((o.period_start for o in used), default=min((o.period_start for o in all_obs), default=as_of)),
        "period_end": as_of,
        "params": PARAMS,
    }


def warnings_for(a: dict) -> list[dict]:
    """Aturan early warning. Anomali = sinyal untuk diperiksa, bukan bukti budaya terancam."""
    out = []
    if a["risk_level"] == "HIGH":
        out.append({"severity": "HIGH", "title": "Risiko tinggi",
                    "description": f"Skor risiko {a['risk_score']:.0f}/100 (ambang {THRESHOLDS['HIGH']:.0f}).",
                    "triggered_by": {"rule": "level_high", "risk_score": a["risk_score"]}})
    for f in a["factors"]:
        if f["normalized_risk"] >= SHARP_DROP_RISK:
            out.append({"severity": "MEDIUM", "title": f"Perubahan tajam: {f['indicator_name']}",
                        "description": f"Berubah {f['change_pct']:+.0f}% dibanding periode sebelumnya. Perlu diperiksa, bisa juga akibat perubahan metode pendataan.",
                        "triggered_by": {"rule": "sharp_change", "indicator": f["indicator_code"],
                                         "evidence": f["evidence_observation_ids"]}})
    if a["risk_level"] in ("HIGH", "MEDIUM") and a["data_confidence"] < LOW_CONFIDENCE:
        out.append({"severity": "LOW", "title": "Perlu verifikasi data",
                    "description": f"Risiko {a['risk_level']} tetapi data confidence hanya {a['data_confidence']:.2f}.",
                    "triggered_by": {"rule": "low_confidence", "data_confidence": a["data_confidence"]}})
    return out
