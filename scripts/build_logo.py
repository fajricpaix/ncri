"""Bangun logo SVG berlapis dari PNG asli: python scripts/build_logo.py  (butuh: pip install vtracer pillow)

Sumber: design/ncri-logo-original.png (logo dari pemilik proyek). Di-trace otomatis ke vektor (teks ikut jadi path,
siap untuk Lottie), lalu dikelompokkan menjadi layer bernama. Keluaran: apps/web/public/brand/ncri-logo.svg & ncri-icon.svg
"""
import os
import re
import sys

import vtracer
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "design/ncri-logo-original.png")
OUT = os.path.join(ROOT, "apps/web/public/brand")
TMP = "/tmp/ncri-trace"
DIVIDER_X = 830  # px pada gambar asli 2172x724: kiri = emblem, kanan = wordmark


def trace():
    os.makedirs(TMP, exist_ok=True)
    im = Image.open(SRC).convert("RGBA")
    flat = Image.new("RGBA", im.size, (255, 255, 255, 255))
    flat.alpha_composite(im)
    flat.convert("RGB").save(f"{TMP}/flat.png")
    vtracer.convert_image_to_svg_py(f"{TMP}/flat.png", f"{TMP}/cut.svg", colormode="color", hierarchical="cutout",
                                    mode="spline", filter_speckle=6, color_precision=6, layer_difference=24,
                                    corner_threshold=60, length_threshold=4.0, splice_threshold=45, path_precision=1)
    return im.size, open(f"{TMP}/cut.svg").read()


def bbox(d, tx, ty):
    nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs) + tx, min(ys) + ty, max(xs) + tx, max(ys) + ty


def kind(hexcolor):
    r, g, b = (int(hexcolor[i:i + 2], 16) for i in (1, 3, 5))
    if min(r, g, b) >= 245:
        return None  # latar putih
    if r > 140 and g < 115 and b < 115:
        return "red"
    if max(r, g, b) - min(r, g, b) < 28 and (r + g + b) / 3 > 170:
        return "white"
    if r > b + 25 and r >= g:
        return "gold"
    return "navy"


def main():
    (w, h), svg = trace()
    paths = re.findall(r'<path d="([^"]*)" fill="(#[0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"/>', svg)
    groups = {}
    for d, fill, tx, ty in paths:
        k = kind(fill)
        if k is None:
            continue
        x0, y0, x1, y1 = bbox(d, float(tx), float(ty))
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        el = f'<path d="{d}" fill="{fill}" transform="translate({tx},{ty})"/>'
        if cx < DIVIDER_X - 20:
            g = {"gold": "emblem-gold", "navy": "emblem-navy", "red": "flag-red", "white": "flag-white"}[k]
        elif k == "gold":
            g = "wordmark-gold"
        elif cy < 470:
            g = "wordmark-letters"
        elif cy < 575:
            g = "wordmark-subtitle"
        else:
            g = "wordmark-tagline"
        groups.setdefault(g, []).append((el, (x0, y0, x1, y1)))

    order = ["wings-note", "flag-red", "flag-white", "emblem-gold", "emblem-navy", "wordmark-gold", "wordmark-letters",
             "wordmark-subtitle", "wordmark-tagline"]
    def block(names):
        return "\n".join(f'<g id="{n}">' + "".join(e for e, _ in groups[n]) + "</g>" for n in names if n in groups)

    os.makedirs(OUT, exist_ok=True)
    emb = ["flag-red", "flag-white", "emblem-gold", "emblem-navy"]
    wm = ["wordmark-gold", "wordmark-letters", "wordmark-subtitle", "wordmark-tagline"]
    ex = [b for n in emb for _, b in groups[n]]
    ex0, ey0, ex1, ey1 = min(b[0] for b in ex), min(b[1] for b in ex), max(b[2] for b in ex), max(b[3] for b in ex)
    head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="NCRI - National Cultural Risk Intelligence">'
    open(f"{OUT}/ncri-logo.svg", "w").write(head.format(vb=f"0 0 {w} {h}") + f'\n<g id="emblem">{block(emb)}</g>\n<g id="wordmark">{block(wm)}</g>\n</svg>\n')
    pad = 6
    open(f"{OUT}/ncri-icon.svg", "w").write(head.format(vb=f"{ex0 - pad:.0f} {ey0 - pad:.0f} {ex1 - ex0 + 2 * pad:.0f} {ey1 - ey0 + 2 * pad:.0f}")
                                            .replace("NCRI - National Cultural Risk Intelligence", "NCRI") + f'\n<g id="emblem">{block(emb)}</g>\n</svg>\n')
    # varian untuk latar gelap: bagian navy diterangkan (wajah, stupa, pola) agar tidak lebur dengan sidebar
    def lighten(m):
        c = [int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4)]
        return 'fill="#%02x%02x%02x"' % tuple(round(255 - (255 - v) * 0.14) for v in c)
    dark = open(f"{OUT}/ncri-icon.svg").read()
    a = dark.index('<g id="emblem-navy">')
    b = dark.index("</g>", a)
    dark = dark[:a] + re.sub(r'fill="#([0-9A-Fa-f]{6})"', lighten, dark[a:b]) + dark[b:]
    open(f"{OUT}/ncri-icon-dark.svg", "w").write(dark)
    for n in order:
        if n in groups:
            print(f"{n}: {len(groups[n])} path")


if __name__ == "__main__":
    sys.exit(main())
