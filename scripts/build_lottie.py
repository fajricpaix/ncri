"""Ubah apps/web/public/brand/ncri-icon-dark.svg jadi animasi Lottie: python scripts/build_lottie.py
Tiap layer bernama (flag-red, flag-white, emblem-gold, emblem-navy) masuk bergantian. Keluaran: ncri-icon.lottie.json"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "apps/web/public/brand")
VB = (63, 42, 738, 628)  # viewBox
CX, CY = VB[0] + VB[2] / 2, VB[1] + VB[3] / 2
r1 = lambda v: round(v, 1)


def shapes(d, tx, ty):
    """'M..C..Z' (mungkin banyak subpath) -> list shape path Lottie, translasi sudah ditanam."""
    out = []
    for sub in re.findall(r"M[^M]*", d):
        n = [float(x) for x in re.findall(r"-?\d+\.?\d*", sub)]
        p0 = (n[0] + tx, n[1] + ty)
        v, i, o = [p0], [(0, 0)], []
        prev = p0
        for k in range(2, len(n) - 5, 6):
            c1, c2, e = [(n[k + j] + tx, n[k + j + 1] + ty) for j in (0, 2, 4)]
            o.append((c1[0] - prev[0], c1[1] - prev[1]))
            v.append(e)
            i.append((c2[0] - e[0], c2[1] - e[1]))
            prev = e
        o.append((0, 0))
        if abs(v[-1][0] - p0[0]) < 0.05 and abs(v[-1][1] - p0[1]) < 0.05 and len(v) > 1:  # kurva menutup ke titik awal
            i[0] = i.pop()
            v.pop()
            o.pop()
        pt = lambda a: [[r1(x), r1(y)] for x, y in a]
        out.append({"ty": "sh", "ks": {"a": 0, "k": {"c": True, "v": pt(v), "i": pt(i), "o": pt(o)}}})
    return out


def kf(t, v, ease=True):
    k = {"t": t, "s": v}
    if ease:
        n = len(v)
        k["o"] = {"x": [0.3] * n, "y": [1.4] * n}  # sedikit overshoot (membal)
        k["i"] = {"x": [0.6] * n, "y": [1] * n}
    return k


def layer(name, groups, start, end, scale0):
    s = {"a": 1, "k": [kf(start, [scale0] * 2 + [100]), kf(end, [100, 100, 100], False)]}
    op = {"a": 1, "k": [kf(start, [0]), kf(start + (end - start) // 2, [100], False)]}
    return {"ddd": 0, "ty": 4, "nm": name, "ind": 0, "sr": 1, "st": 0, "bm": 0, "ao": 0, "ip": 0, "op": 150,
            "ks": {"o": op, "r": {"a": 0, "k": 0}, "p": {"a": 0, "k": [CX - VB[0], CY - VB[1], 0]},
                   "a": {"a": 0, "k": [CX, CY, 0]}, "s": s},
            "shapes": groups}


def build():
    svg = open(os.path.join(BRAND, "ncri-icon-dark.svg")).read()
    plan = {"emblem-navy": (24, 54, 100), "emblem-gold": (10, 50, 80), "flag-white": (6, 34, 0), "flag-red": (0, 30, 0)}
    layers = []
    for name, (a, b, sc) in plan.items():  # urutan = z-order (atas dulu): navy, gold, putih, merah
        body = re.search(rf'<g id="{name}">(.*?)</g>', svg, re.S).group(1)
        groups = []
        for m in re.finditer(r"<path ([^>]*?)/>", body):
            at = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
            tx, ty = map(float, re.findall(r"-?\d+\.?\d*", at.get("transform", "translate(0,0)"))[:2])
            h = at["fill"].lstrip("#")
            col = [int(h[j:j + 2], 16) / 255 for j in (0, 2, 4)] + [1]
            groups.append({"ty": "gr", "it": shapes(at["d"], tx, ty) + [
                {"ty": "fl", "c": {"a": 0, "k": [round(c, 3) for c in col]}, "o": {"a": 0, "k": 100}, "r": 2},
                {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [100, 100]},
                 "r": {"a": 0, "k": 0}, "o": {"a": 0, "k": 100}}]})
        layers.append(layer(name, groups, a, b, sc))
    for n, l in enumerate(layers, 1):
        l["ind"] = n
    return {"v": "5.7.0", "fr": 30, "ip": 0, "op": 150, "w": VB[2], "h": VB[3], "nm": "NCRI icon", "ddd": 0,
            "assets": [], "layers": layers}


if __name__ == "__main__":
    out = os.path.join(BRAND, "ncri-icon.lottie.json")
    json.dump(build(), open(out, "w"), separators=(",", ":"))
    print(out, os.path.getsize(out) // 1024, "KB")
