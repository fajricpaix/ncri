from app.reports import MAP_PARENT, _safe, _tally


def test_csv_injection_is_neutralised_but_numbers_untouched():
    assert _safe("=HYPERLINK(\"http://x\")") == "'=HYPERLINK(\"http://x\")"
    assert _safe("@SUM(A1)") == "'@SUM(A1)" and _safe("-2+3") == "'-2+3"
    assert _safe("Tari Topeng") == "Tari Topeng" and _safe(-5.0) == -5.0 and _safe(None) is None


def test_tally_levels_and_insufficient():
    rows = [{"level": "HIGH", "score": 90.0, "confidence": .5}, {"level": "LOW", "score": 20.0, "confidence": .7},
            {"level": "INSUFFICIENT_DATA", "score": None, "confidence": None}]
    t = _tally(rows)
    assert t["distribution"] == {"HIGH": 1, "MEDIUM": 0, "LOW": 1, "INSUFFICIENT_DATA": 1}
    assert t["avg_score"] == 55.0 and t["level"] == "MEDIUM" and t["assessed"] == 2
    assert _tally([{"level": "INSUFFICIENT_DATA", "score": None, "confidence": None}])["level"] == "INSUFFICIENT_DATA"


def test_pemekaran_rolled_into_parent_for_2017_boundaries():
    assert MAP_PARENT == {"93": "91", "94": "91", "95": "91", "96": "92"}
