from datetime import date, datetime

from app.risk import Ind, Obs, assess, classify, indicator_risk, warnings_for

NOW = datetime(2026, 1, 1)
TODAY = date(2025, 6, 1)


def ob(i, year, value, verified=False, src="s1", start=None):
    return Obs(f"{i}-{year}", start or date(year, 1, 1), date(year, 12, 31), value, verified, src, NOW)


def inds():
    return [Ind(c, c, c, "LOWER_IS_WORSE", w) for c, w in [("a", .25), ("b", .25), ("c", .2), ("d", .15), ("e", .15)]]


def series(values):  # {ind: (v2023, v2024)}
    return {k: [ob(k, 2023, a), ob(k, 2024, b)] for k, (a, b) in values.items()}


def test_normalization_and_classification():
    risk, change, *_ = indicator_risk([ob("x", 2023, 100), ob("x", 2024, 70)], "LOWER_IS_WORSE")
    assert change == -30 and risk == 60          # turun 30% -> 60/100
    assert indicator_risk([ob("x", 2023, 100), ob("x", 2024, 130)], "LOWER_IS_WORSE")[0] == 0
    assert [classify(s) for s in (39.9, 40, 69.9, 70)] == ["LOW", "MEDIUM", "MEDIUM", "HIGH"]


def test_score_is_weighted_sum_and_reproducible():
    a = assess(inds(), series({k: (100, 50) for k in "abcde"}), date(2024, 12, 31), TODAY)
    assert a["risk_score"] == 100 and a["risk_level"] == "HIGH"
    assert abs(sum(f["contribution"] for f in a["factors"]) - a["risk_score"]) < 0.05


def test_insufficient_data_instead_of_forced_class():
    a = assess(inds(), series({"a": (100, 50), "b": (100, 50)}), date(2024, 12, 31), TODAY)
    assert a["risk_level"] == "INSUFFICIENT_DATA" and a["risk_score"] is None


def test_missing_indicator_renormalizes_weights_and_lowers_confidence():
    full = assess(inds(), series({k: (100, 80) for k in "abcde"}), date(2024, 12, 31), TODAY)
    part = assess(inds(), series({k: (100, 80) for k in "abcd"}), date(2024, 12, 31), TODAY)
    assert abs(sum(f["weight"] for f in part["factors"]) - 1) < 1e-3
    assert part["data_confidence"] < full["data_confidence"]


def test_incomparable_periods_and_gaps_are_skipped():
    half_year = Obs("h", date(2024, 1, 1), date(2024, 6, 30), 10, False, "s1", NOW)
    assert indicator_risk([ob("x", 2023, 100), half_year], "LOWER_IS_WORSE") is None
    assert indicator_risk([ob("x", 2023, 100), ob("x", 2024, None)], "LOWER_IS_WORSE") is None  # gap bukan nol


def test_warnings_and_confidence_not_equal_to_risk():
    a = assess(inds(), series({k: (100, 50) for k in "abcde"}), date(2024, 12, 31), date(2027, 1, 1))  # data sudah usang
    titles = [w["title"] for w in warnings_for(a)]
    assert "Risiko tinggi" in titles and "Perlu verifikasi data" in titles  # skor 100 tapi confidence rendah
    assert a["data_confidence"] < 0.6 < a["risk_score"] / 100
