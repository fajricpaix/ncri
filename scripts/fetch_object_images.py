"""Ambil thumbnail objek budaya dari Wikipedia (gambar utama artikel; lisensi bebas/CC, lihat halaman sumber).
Hasil: apps/web/public/objects/<slug>.jpg + manifest.json {nama: {file, page}}. Jalankan dari root: python scripts/fetch_object_images.py"""
import json, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
import csv

OUT = Path("apps/web/public/objects")
OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "ncri-dev-image-fetch/1.0"}
names = [r["name"] for r in csv.DictReader(open("data/export/cultural_objects.csv", encoding="utf-8"))]
slug = lambda n: re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-")

def get(url):
    for wait in (3, 10, 30, 60):  # 429 dari Wikipedia: jeda lalu ulang
        time.sleep(1)
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read()
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(wait)
    raise RuntimeError("429 terus")

def lookup(name):
    for lang in ("id", "en"):
        q = urllib.parse.urlencode({"action": "query", "format": "json", "redirects": 1, "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": 160, "titles": name})
        pages = json.loads(get(f"https://{lang}.wikipedia.org/w/api.php?{q}"))["query"]["pages"]
        for p in pages.values():
            if "thumbnail" in p:
                return p["thumbnail"]["source"], f"https://{lang}.wikipedia.org/wiki/{urllib.parse.quote(p['title'].replace(' ', '_'))}"
    return None

old = OUT / 'manifest.json'
manifest = json.loads(old.read_text()) if old.exists() else {}
for n in names:
    if n in manifest: continue
    try:
        r = lookup(n)
        if not r: print("tidak ada:", n); continue
        (OUT / f"{slug(n)}.jpg").write_bytes(get(r[0]))
        manifest[n] = {"file": f"/objects/{slug(n)}.jpg", "page": r[1]}
    except Exception as e:
        print("gagal:", n, e)
(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
print(len(manifest), "dari", len(names))
