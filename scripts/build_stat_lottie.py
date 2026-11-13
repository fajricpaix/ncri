"""Bikin apps/web/public/brand/stat-<tone>.lottie.json: gelembung ikon kartu statistik (pop + kilau + riak cincin). Satu file per warna."""
import json, pathlib
TONES = {  # (warna isi muda, warna garis/cincin)
    "blue": ("#dbe8fb", "#3b6fd1"), "purple": ("#ece3fd", "#7c3aed"), "green": ("#d9f3e3", "#2e9e5b"),
    "amber": ("#fcefcb", "#e0a21a"), "red": ("#fcdcdb", "#d64545"), "slate": ("#e3e8ef", "#64748b"),
}
rgb = lambda h: [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
v = lambda x: {"a": 0, "k": x}
def anim(kfs):
    out = []
    for i, (t, val) in enumerate(kfs):
        k = {"t": t, "s": val if isinstance(val, list) else [val]}
        if i < len(kfs) - 1: k.update(i={"x": [0.3], "y": [1]}, o={"x": [0.7], "y": [0]})
        out.append(k)
    return {"a": 1, "k": out}
tr = lambda: {"ty": "tr", "p": v([0, 0]), "a": v([0, 0]), "s": v([100, 100]), "r": v(0), "o": v(100)}
fill = lambda c, o=100: {"ty": "fl", "c": v(rgb(c)), "o": v(o)}
stroke = lambda c, w, o=100: {"ty": "st", "c": v(rgb(c)), "o": v(o), "w": v(w), "lc": 2, "lj": 2}
el = lambda cx, cy, w, h: {"ty": "el", "p": v([cx, cy]), "s": v([w, h])}
def layer(name, items, s=None, o=None, r=0):
    return {"ty": 4, "nm": name, "ind": 0, "ip": 0, "op": 75, "st": 0, "sr": 1, "ao": 0,
            "ks": {"o": o or v(100), "r": v(r), "p": v([40, 40, 0]), "a": v([40, 40, 0]), "s": s or v([100, 100, 100])},
            "shapes": [{"ty": "gr", "it": items + [tr()]}]}
pop = lambda d=0: anim([(d, [0, 0, 100]), (d + 10, [112, 112, 100]), (d + 17, [100, 100, 100])])
for name, (light, dark) in TONES.items():
    layers = [
        layer("gloss", [el(29, 24, 22, 10), fill("#ffffff", 70)], s=pop(2), r=-30),
        layer("bubble", [el(40, 40, 64, 64), fill(light), stroke(dark, 1.5, 35)], s=pop()),
        layer("ring1", [el(40, 40, 64, 64), stroke(dark, 2)], s=anim([(14, [100, 100, 100]), (48, [128, 128, 100])]), o=anim([(14, 55), (48, 0)])),
        layer("ring2", [el(40, 40, 64, 64), stroke(dark, 1.5)], s=anim([(26, [100, 100, 100]), (62, [128, 128, 100])]), o=anim([(26, 40), (62, 0)])),
    ]
    for i, l in enumerate(layers): l["ind"] = i + 1
    doc = {"v": "5.7.0", "fr": 30, "ip": 0, "op": 75, "w": 80, "h": 80, "nm": f"stat-{name}", "ddd": 0, "assets": [], "layers": layers}
    pathlib.Path(f"apps/web/public/brand/stat-{name}.lottie.json").write_text(json.dumps(doc, separators=(",", ":")))
