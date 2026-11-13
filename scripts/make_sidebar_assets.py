"""Menyusun aset sidebar berlapis dari batik default + foto landmark (dijalankan manual, hasil di-commit).
  python scripts/make_sidebar_assets.py batik.jpg  -> public/brand/sidebar/batik-back.webp + batik-front.webp (lapisan depan = gelombang bawah, transparan di atasnya)
  python scripts/make_sidebar_assets.py landmark foto.jpg nama x0 x1 y0 y1 yBase -> public/brand/sidebar/landmark/<nama>.webp (potongan transparan, lebar 816)
Susunan tumpukan di SidebarArt: batik-back -> landmark -> batik-front."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path("apps/web/public/brand/sidebar"); W, H = 816, 1295
# garis emas gelombang depan pada batik-back (x, y)
CURVE = [(0, 750), (100, 775), (200, 840), (260, 910), (300, 970), (360, 1025), (430, 1060), (500, 1062), (580, 1035), (650, 1005), (720, 992), (816, 995)]

def batik(path):
    im = Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS)
    im.save(OUT / "batik-back.webp", quality=90)
    xs, ys = zip(*CURVE)
    y = np.interp(range(W), xs, ys)
    k = 41; y = np.convolve(np.pad(y, k // 2, mode="edge"), np.ones(k) / k, mode="valid")  # haluskan sudut polyline
    poly = [(x, float(y[x]) - 4) for x in range(W)] + [(W, H), (0, H)]
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    front = im.copy(); front.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)))
    front.save(OUT / "batik-front.webp", quality=90)

def landmark(src, name, x0, x1, y0, y1, ybase):
    ph = Image.open(src).convert("RGB").crop((x0, y0, x1, y1))
    ph = ph.resize((W, round(W * ph.height / ph.width)), Image.LANCZOS)
    a = np.asarray(ph).astype(float)
    mx, mn = a.max(2), a.min(2); sat = (mx - mn) / np.maximum(mx, 1)
    sky = (mx > 150) & (sat < 0.22)                       # langit: terang & tak jenuh
    h, w = sky.shape
    seen = np.zeros_like(sky)                              # langit yang tersambung ke tepi atas/kiri/kanan (BFS)
    todo = [(0, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while todo:
        y, x = todo.pop()
        if 0 <= y < h and 0 <= x < w and sky[y, x] and not seen[y, x]:
            seen[y, x] = True
            todo += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    bg = Image.fromarray((seen * 255).astype("uint8"))
    fg = bg.point(lambda v: 255 - v).filter(ImageFilter.MinFilter(3))          # erosi 1px, buang halo
    alpha = fg.filter(ImageFilter.GaussianBlur(1.0))
    # menyatu dengan navy: tint dingin ringan
    tint = Image.new("RGB", ph.size, (120, 140, 190))
    from PIL import ImageChops
    ph = Image.blend(ph, ImageChops.multiply(ph, tint), .35)
    ph.putalpha(alpha)
    (OUT / "landmark").mkdir(exist_ok=True)
    ph.crop((0, 0, W, min(ph.height, ybase))).save(OUT / "landmark" / f"{name}.webp", quality=90)

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    if sys.argv[1] == "landmark":
        landmark(sys.argv[2], sys.argv[3], *map(int, sys.argv[4:9]))
    else:
        batik(sys.argv[1])
