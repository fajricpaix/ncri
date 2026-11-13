"""Bikin apps/web/public/brand/sidebar-batik.lottie.json: gelombang emas + deret kawung (batik) yang muncul bertahap.
Komposisi 256x340 (sama dengan viewBox SidebarArt). Jalankan ulang kalau desain diubah."""
import json, pathlib

GOLD = [0.851, 0.663, 0.227, 1]
def v(x): return {"a": 0, "k": x}
def anim(kfs):  # kfs: [(frame, value)] dengan easing halus
    out = []
    for i, (t, val) in enumerate(kfs):
        k = {"t": t, "s": val if isinstance(val, list) else [val]}
        if i < len(kfs) - 1:
            k.update(i={"x": [0.3], "y": [1]}, o={"x": [0.7], "y": [0]})
        out.append(k)
    return {"a": 1, "k": out}
def stroke(w, o=100): return {"ty": "st", "c": v(GOLD), "o": v(o), "w": v(w), "lc": 2, "lj": 2}
def tr(r=0): return {"ty": "tr", "p": v([0, 0]), "a": v([0, 0]), "s": v([100, 100]), "r": v(r), "o": v(100)}
def layer(name, shapes, p=(0, 0), s=None, o=None, ip=0):
    return {"ty": 4, "nm": name, "ind": 0, "ip": ip, "op": 90, "st": 0, "sr": 1, "ao": 0,
            "ks": {"o": o or v(100), "r": v(0), "p": v(list(p) + [0]), "a": v([0, 0, 0]), "s": s or v([100, 100, 100])},
            "shapes": shapes}

wave = {"ty": "sh", "ks": v({"c": False, "v": [[0, 296], [128, 296], [256, 296]],
        "o": [[42.67, -14.67], [42.67, 14.67], [0, 0]], "i": [[0, 0], [-42.67, -14.67], [-42.67, 14.67]]})}
layers = [layer("wave", [{"ty": "gr", "it": [wave, stroke(2), {"ty": "tm", "s": v(0), "e": anim([(0, 0), (40, 100)]), "o": v(0), "m": 1}, tr()]}])]

def petals():  # satu kawung: 4 elips berputar
    return [{"ty": "gr", "it": [{"ty": "el", "p": v([0, 0]), "s": v([9, 24])}, stroke(1.3), tr(r)]} for r in (0, 45, 90, 135)] + \
           [{"ty": "gr", "it": [{"ty": "el", "p": v([0, 0]), "s": v([5, 5])}, {"ty": "fl", "c": v(GOLD), "o": v(100)}, tr()]}]

for i in range(7):
    x, d = 20 + 38 * i, 18 + i * 4
    layers.append(layer(f"kawung{i}", petals(), p=(x, 322),
        s=anim([(d, [0, 0, 100]), (d + 24, [100, 100, 100])]), o=anim([(d, 0), (d + 10, 70)])))
for l in layers: l["ind"] = layers.index(l) + 1

doc = {"v": "5.7.0", "fr": 30, "ip": 0, "op": 90, "w": 256, "h": 340, "nm": "sidebar-batik", "ddd": 0, "assets": [], "layers": layers}
pathlib.Path("apps/web/public/brand/sidebar-batik.lottie.json").write_text(json.dumps(doc, separators=(",", ":")))
