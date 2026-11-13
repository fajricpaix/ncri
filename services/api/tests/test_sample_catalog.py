from collections import Counter
from datetime import date, datetime

from app.risk import Ind, Obs, assess
from app.sample_catalog import CATALOG, INDICATORS, YEARS, build, period

WEIGHTS = {"ACTIVE_PRACTITIONERS": .25, "SUCCESSORS": .25, "ACTIVITY_FREQUENCY": .20, "ACTIVE_COMMUNITIES": .15, "KNOWLEDGE_TRANSFER": .15}
INDS = [Ind(c, c, c, "LOWER_IS_WORSE", w) for c, w in WEIGHTS.items()]


def levels(as_of=date(2024, 12, 31)):
    objects, obs = build()
    by = {}
    for o in obs:
        s, e = period(o["year"])
        by.setdefault(o["object"], {}).setdefault(o["indicator"], []).append(
            Obs(f"{o['object']}-{o['indicator']}-{o['year']}-{o['source']}", s, e, float(o["value"]), o["verified"], o["source"],
                datetime(2026, 1, 1), True))
    out = {}
    for obj in objects:
        a = assess(INDS, by.get(obj["code"], {}), as_of, date(2026, 11, 13))
        out[obj["code"]] = a["risk_level"]
    return objects, obs, out


def test_deterministic_and_well_formed():
    assert build() == build()
    _, obs = build()
    keys = [(o["object"], o["indicator"], o["year"], o["source"]) for o in obs]
    assert len(keys) == len(set(keys))                       # sesuai unique constraint di DB
    assert all(isinstance(o["value"], int) and o["value"] >= 1 for o in obs)  # tidak ada nol (nol = bukan gap)
    assert {o["year"] for o in obs} <= set(YEARS)


def test_catalog_covers_every_feature_surface():
    objects, _ = build()
    assert len(objects) >= 50 and len({o["code"] for o in objects}) == len(objects)
    assert len({o["province"] for o in objects}) >= 24
    assert len({o["category"] for o in objects}) == 6
    assert any(o["verified"] for o in objects) and any(not o["verified"] for o in objects)


def test_risk_distribution_has_every_level_in_sensible_proportions():
    _, _, lv = levels()
    c = Counter(lv.values())
    assert 8 <= c["HIGH"] <= 20 and c["MEDIUM"] >= 10 and c["LOW"] >= 14 and c["INSUFFICIENT_DATA"] >= 5, c


def test_trend_over_time_worsens_so_the_trend_chart_is_interesting():
    _, _, early = levels(date(2021, 12, 31))
    _, _, late = levels(date(2024, 12, 31))
    assert Counter(late.values())["HIGH"] > Counter(early.values())["HIGH"]


def test_five_assessments_per_scored_object_for_readiness_demo():
    assert len(YEARS) - 1 == 5 and len(INDICATORS) == 5
