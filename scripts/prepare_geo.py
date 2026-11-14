"""Siapkan GeoJSON provinsi untuk peta: python scripts/prepare_geo.py <indonesia-38-provinces.geojson>

Sumber: denyherianto/indonesia-geojson-topojson-maps-with-38-provinces (CC BY 4.0), 38 provinsi pasca-pemekaran Papua.
https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces/raw/main/GeoJSON/indonesia-38-provinces.geojson
Kode di berkas sumber untuk 4 provinsi baru salah (semua 91/92), jadi kode diambil dari NAMA (tabel CODE).
Keluaran dipangkas (koordinat 3 desimal, pulau sangat kecil dibuang) agar ringan; hanya properti `code`.
"""
import json
import sys

CODE = {
    "Aceh": "11", "Sumatera Utara": "12", "Sumatera Barat": "13", "Riau": "14", "Jambi": "15",
    "Sumatera Selatan": "16", "Bengkulu": "17", "Lampung": "18", "Kepulauan Bangka Belitung": "19",
    "Kepulauan Riau": "21", "DKI Jakarta": "31", "Jawa Barat": "32", "Jawa Tengah": "33",
    "Daerah Istimewa Yogyakarta": "34", "Jawa Timur": "35", "Banten": "36", "Bali": "51",
    "Nusa Tenggara Barat": "52", "Nusa Tenggara Timur": "53", "Kalimantan Barat": "61",
    "Kalimantan Tengah": "62", "Kalimantan Selatan": "63", "Kalimantan Timur": "64", "Kalimantan Utara": "65",
    "Sulawesi Utara": "71", "Sulawesi Tengah": "72", "Sulawesi Selatan": "73", "Sulawesi Tenggara": "74",
    "Gorontalo": "75", "Sulawesi Barat": "76", "Maluku": "81", "Maluku Utara": "82", "Papua": "91",
    "Papua Barat": "92", "Papua Selatan": "93", "Papua Tengah": "94", "Papua Pegunungan": "95",
    "Papua Barat Daya": "96",
}
MIN_BBOX_AREA = 0.0015  # derajat^2; di bawah ini dianggap pulau kecil dan dibuang


TOLERANCE = 0.012  # derajat (~1,3 km): cukup untuk peta nasional


def rdp(pts, eps):
    """Douglas-Peucker iteratif."""
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5 or 1e-12
        dmax, idx = 0.0, None
        for i in range(a + 1, b):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / norm
            if d > dmax:
                dmax, idx = d, i
        if idx is not None and dmax > eps:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def ring(r):
    pts = [(x, y) for x, y in r]
    mid = len(pts) // 2  # ring tertutup: awal == akhir, jadi pecah di tengah agar RDP tidak runtuh
    out = rdp(pts[: mid + 1], TOLERANCE) + rdp(pts[mid:], TOLERANCE)[1:]
    out = [[round(x, 3), round(y, 3)] for x, y in out]
    return out if len(out) >= 4 else None


def bbox_area(r):
    xs, ys = [p[0] for p in r], [p[1] for p in r]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


def main(src, dst="apps/web/public/geo/idn-adm1.json"):
    g = json.load(open(src))
    feats = []
    for f in g["features"]:
        code = CODE[f["properties"]["PROVINSI"]]
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        keep = []
        for poly in polys:
            outer = ring(poly[0])
            if outer and bbox_area(outer) >= MIN_BBOX_AREA:
                keep.append([outer] + [h for h in (ring(r) for r in poly[1:]) if h])
        assert keep, code
        feats.append({"type": "Feature", "properties": {"code": code},
                      "geometry": {"type": "MultiPolygon", "coordinates": keep}})
    assert len(feats) == 38 and len({f["properties"]["code"] for f in feats}) == 38
    json.dump({"type": "FeatureCollection", "features": feats}, open(dst, "w"), separators=(",", ":"))
    print(dst, len(feats), "provinsi")


if __name__ == "__main__":
    main(*sys.argv[1:])
