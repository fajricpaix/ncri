"""Bikin apps/web/public/brand/search.lottie.json: kaca pembesar emas (lensa + gagang digambar, lalu bergoyang memindai)."""
import json, pathlib
GOLD = [0.949, 0.757, 0.28, 1]
v = lambda x: {"a": 0, "k": x}
def anim(kfs, ease=True):
    out = []
    for i, (t, val) in enumerate(kfs):
        k = {"t": t, "s": val if isinstance(val, list) else [val]}
        if i < len(kfs) - 1 and ease: k.update(i={"x": [0.4], "y": [1]}, o={"x": [0.6], "y": [0]})
        out.append(k)
    return {"a": 1, "k": out}
st = lambda w: {"ty": "st", "c": v(GOLD), "o": v(100), "w": v(w), "lc": 2, "lj": 2}
tm = lambda a, b, c, d: {"ty": "tm", "s": v(0), "e": anim([(a, 0), (b, 100)]), "o": v(0), "m": 1}
tr = {"ty": "tr", "p": v([0, 0]), "a": v([0, 0]), "s": v([100, 100]), "r": v(0), "o": v(100)}
lens = {"ty": "gr", "it": [{"ty": "el", "p": v([26, 26]), "s": v([30, 30])}, st(5), tm(0, 26, 0, 0), tr]}
handle = {"ty": "gr", "it": [{"ty": "sh", "ks": v({"c": False, "v": [[37.5, 37.5], [54, 54]], "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]]})}, st(6), tm(18, 36, 0, 0), tr]}
layer = {"ty": 4, "nm": "search", "ind": 1, "ip": 0, "op": 90, "st": 0, "sr": 1, "ao": 0, "shapes": [handle, lens],
         "ks": {"o": v(100), "p": v([26, 26, 0]), "a": v([26, 26, 0]), "s": v([100, 100, 100]),
                "r": anim([(0, 0), (40, 0), (50, -16), (60, 12), (70, -7), (80, 0)])}}
doc = {"v": "5.7.0", "fr": 30, "ip": 0, "op": 90, "w": 64, "h": 64, "nm": "search", "ddd": 0, "assets": [], "layers": [layer]}
pathlib.Path("apps/web/public/brand/search.lottie.json").write_text(json.dumps(doc, separators=(",", ":")))
