from datetime import date

from app.ml import readiness as r


def series(n_obj, years, score):
    return {f"o{i}": [(date(2020 + k, 12, 31), score(i, k)) for k in range(years)] for i in range(n_obj)}


def test_gap_breaks_the_series_instead_of_being_filled_with_zero():
    s = {"a": [(date(2021, 12, 31), 80.0), (date(2022, 12, 31), None), (date(2023, 12, 31), 90.0)]}
    assert r.transitions(s) == []  # tidak ada pasangan yang melewati periode kosong


def test_temporal_split_has_no_leakage():
    ts = r.transitions(series(5, 6, lambda i, k: 50.0))
    train, test = r.temporal_split(ts, test_periods=1)
    assert train and test and max(t.t1 for t in train) < min(t.t1 for t in test)


def test_metrics_known_values():
    y, p = [1, 0, 1, 0], [1.0, 0.0, 0.0, 0.0]
    assert r.brier(y, p) == 0.25 and r.mae([1, 2], [2, 4]) == 1.5
    assert r.auc([1, 1, 0, 0], [0.9, 0.8, 0.2, 0.1]) == 1.0 and r.auc([1, 1], [0.5, 0.6]) is None
    assert r.auc([1, 0], [0.5, 0.5]) == 0.5


def test_gate_refuses_pilot_sized_simulated_data():
    st = r.stats(series(6, 3, lambda i, k: 90.0 - 10 * k), target_validated=False)
    g = r.gate(st)
    assert not g["passed"] and len(g["reasons"]) >= 5
    assert any("disetujui ahli" in x for x in g["reasons"])


def test_gate_still_refuses_when_data_is_big_but_model_is_not_better_than_baseline():
    big = series(60, 8, lambda i, k: 75.0 if (i + k) % 3 == 0 else 30.0)
    st = r.stats(big, target_validated=True)
    assert all(q["met"] for q in r.requirements(st))
    persist = lambda t: r.baseline_persistence(t)  # model = baseline => tidak ada peningkatan
    ev = r.evaluate(r.temporal_split(r.transitions(big))[1], persist)
    assert not r.gate(st, ev)["passed"]
    assert not r.gate(st, None)["passed"]  # tanpa evaluasi model pun ditolak


def test_gate_passes_only_when_everything_holds():
    big = series(60, 8, lambda i, k: 75.0 if (i + k) % 3 == 0 else 30.0)
    st = r.stats(big, target_validated=True)
    oracle = lambda t: float(t.event)  # model sempurna (hanya untuk menguji gerbang)
    ev = r.evaluate(r.temporal_split(r.transitions(big))[1], oracle)
    assert r.gate(st, ev)["passed"]


def test_stats_of_empty_series_means_nothing_is_ready():
    """Dipakai saat semua penilaian berasal dari data simulasi (dikecualikan): tidak ada yang terpenuhi."""
    st = r.stats({}, target_validated=False)
    assert st["objects_with_series"] == 0 and st["transitions"] == 0
    assert not any(q["met"] for q in r.requirements(st)) and not r.gate(st)["passed"]
