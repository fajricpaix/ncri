"""Kerangka validasi prediksi (Sprint 6). Fungsi murni, tanpa DB, tanpa library ML.

Prediksi TIDAK pernah ditampilkan kecuali `gate()` lulus. Dengan data simulasi/pilot, gate sengaja gagal.
Target PROVISIONAL (belum disetujui ahli): "objek berstatus HIGH pada periode berikutnya".
Ambang di bawah adalah usulan awal untuk didiskusikan dengan ahli statistik, bukan standar baku."""
from collections import defaultdict
from dataclasses import dataclass
from datetime import date

THRESHOLDS = {
    "min_objects": 30,             # objek dengan >= 2 penilaian
    "min_periods_per_object": 5,   # panjang runtun waktu terpanjang
    "min_transitions": 100,        # pasangan (periode t -> t+1)
    "min_positive_events": 15,     # kejadian HIGH pada t+1 (kelas langka butuh cukup contoh)
    "min_test_transitions": 30,    # data uji (periode terbaru) setelah pemisahan temporal
    "min_improvement_over_baseline": 0.05,  # selisih Brier minimum vs baseline persistensi
}
HIGH = 70.0


@dataclass(frozen=True)
class Transition:
    obj: str
    t: date
    t1: date
    score_t: float
    score_t1: float

    @property
    def event(self) -> int:  # target provisional
        return int(self.score_t1 >= HIGH)


def transitions(series: dict[str, list[tuple[date, float | None]]]) -> list[Transition]:
    """Pasangan periode berurutan per objek. Periode tanpa skor (INSUFFICIENT_DATA) memutus runtun: tidak diisi nol."""
    out = []
    for obj, pts in series.items():
        pts = sorted(pts)
        for (d0, s0), (d1, s1) in zip(pts, pts[1:]):
            if s0 is not None and s1 is not None:
                out.append(Transition(obj, d0, d1, s0, s1))
    return out


def temporal_split(ts: list[Transition], test_periods: int = 1):
    """Latih pada masa lalu, uji pada `test_periods` periode terbaru. Tidak ada kebocoran: semua t1 uji > semua t1 latih."""
    ends = sorted({t.t1 for t in ts})
    if len(ends) <= test_periods:
        return [], list(ts)
    cutoff = ends[-test_periods]
    return [t for t in ts if t.t1 < cutoff], [t for t in ts if t.t1 >= cutoff]


# ---- metrik ----
def mae(y, p):
    return sum(abs(a - b) for a, b in zip(y, p)) / len(y)


def brier(y, p):
    return sum((a - b) ** 2 for a, b in zip(y, p)) / len(y)


def auc(y, p):
    """AUC berbasis peringkat (ties = 0,5). None bila hanya satu kelas."""
    pos = [s for s, a in zip(p, y) if a == 1]
    neg = [s for s, a in zip(p, y) if a == 0]
    if not pos or not neg:
        return None
    wins = sum((a > b) + 0.5 * (a == b) for a in pos for b in neg)
    return wins / (len(pos) * len(neg))


def calibration(y, p, bins=5):
    """Per bin probabilitas: (rata-rata prediksi, frekuensi kejadian, n). Kalibrasi baik bila keduanya dekat."""
    buckets = defaultdict(list)
    for a, b in zip(y, p):
        buckets[min(int(b * bins), bins - 1)].append((a, b))
    return [(sum(b for _, b in v) / len(v), sum(a for a, _ in v) / len(v), len(v)) for _, v in sorted(buckets.items())]


def baseline_persistence(t: Transition) -> float:
    """Baseline wajib dikalahkan: 'status sekarang = status berikutnya'."""
    return float(t.score_t >= HIGH)


def evaluate(ts: list[Transition], predict) -> dict | None:
    """predict(Transition) -> probabilitas kejadian HIGH. Dibandingkan dengan baseline pada himpunan yang sama."""
    if not ts:
        return None
    y = [t.event for t in ts]
    p, b = [predict(t) for t in ts], [baseline_persistence(t) for t in ts]
    return {"n": len(ts), "brier": brier(y, p), "brier_baseline": brier(y, b), "auc": auc(y, p),
            "mae_score": None, "calibration": calibration(y, p)}


# ---- kesiapan & gerbang ----
def stats(series, target_validated: bool) -> dict:
    ts = transitions(series)
    train, test = temporal_split(ts)
    longest = max((len(v) for v in series.values()), default=0)
    return {
        "objects_with_series": sum(1 for v in series.values() if sum(s is not None for _, s in v) >= 2),
        "longest_series": longest, "transitions": len(ts), "positive_events": sum(t.event for t in ts),
        "test_transitions": len(test), "train_transitions": len(train), "target_validated": target_validated,
    }


def requirements(st: dict) -> list[dict]:
    T = THRESHOLDS
    rows = [
        ("Objek dengan ≥ 2 penilaian", st["objects_with_series"], T["min_objects"]),
        ("Periode terpanjang per objek", st["longest_series"], T["min_periods_per_object"]),
        ("Pasangan periode (t → t+1)", st["transitions"], T["min_transitions"]),
        ("Kejadian HIGH pada periode berikutnya", st["positive_events"], T["min_positive_events"]),
        ("Data uji (periode terbaru, terpisah waktu)", st["test_transitions"], T["min_test_transitions"]),
    ]
    out = [{"label": l, "current": c, "needed": n, "met": c >= n} for l, c, n in rows]
    out.append({"label": "Definisi target disetujui ahli", "current": int(st["target_validated"]), "needed": 1, "met": st["target_validated"]})
    return out


def gate(st: dict, test_eval: dict | None = None) -> dict:
    """Lulus hanya bila SEMUA syarat data terpenuhi DAN model terbukti mengalahkan baseline pada data uji temporal."""
    reqs = requirements(st)
    reasons = [f"{r['label']}: {r['current']} dari {r['needed']}" for r in reqs if not r["met"]]
    if test_eval is None:
        reasons.append("Belum ada model yang dievaluasi pada data uji")
    elif test_eval["brier_baseline"] - test_eval["brier"] < THRESHOLDS["min_improvement_over_baseline"]:
        reasons.append("Model tidak cukup mengalahkan baseline persistensi (Brier)")
    return {"passed": not reasons, "reasons": reasons, "requirements": reqs, "thresholds": THRESHOLDS}
