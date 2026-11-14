"""Buat gambar contoh format CSV (SVG) untuk halaman Data Submission -> apps/web/public/csv-examples/.
Isi sengaja generik (Nama Objek, Nama Lembaga): hanya contoh FORMAT, bukan data nyata. Jalankan ulang bila kolom importer berubah."""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent.parent / "apps/web/public/csv-examples"
CW, PAD, RH, MINW = 9.0, 14, 34, 720  # lebar karakter monospace 13px (perkiraan), padding sel, tinggi baris

EXAMPLES = {
    "sources": {
        "cols": [("code", 1), ("name", 1), ("source_type", 1), ("description", 0), ("terms_url", 0)],
        "rows": [["SRC-01", "Nama Lembaga Sumber", "GOVERNMENT", "Keterangan singkat", "https://contoh.go.id/data"],
                 ["SRC-02", "Nama Survei Lapangan", "SURVEY", "", ""]],
        "note": "source_type: GOVERNMENT, COMMUNITY, SURVEY, PUBLIC_DATA, atau MANUAL",
    },
    "objects": {
        "cols": [("external_code", 1), ("name", 1), ("category", 1), ("region_code", 1), ("data_origin", 1), ("source_code", 0)],
        "rows": [["OBJ-001", "Nama Objek Budaya A", "Kesenian", "32", "PUBLIC", "SRC-01"],
                 ["OBJ-002", "Nama Objek Budaya B", "Kerajinan", "33", "PARTNER", "SRC-02"]],
        "note": "region_code = kode provinsi · data_origin: PUBLIC atau PARTNER · source_code harus sudah diimpor di langkah 1",
    },
    "observations": {
        "cols": [("object_external_code", 1), ("indicator_code", 1), ("period_start", 1), ("period_end", 1),
                 ("value_numeric", 1), ("source_code", 1), ("data_origin", 1)],
        "rows": [["OBJ-001", "ACTIVE_PRACTITIONERS", "2023-01-01", "2023-12-31", "52", "SRC-01", "PUBLIC"],
                 ["OBJ-001", "ACTIVE_PRACTITIONERS", "2024-01-01", "2024-12-31", "45", "SRC-01", "PUBLIC"],
                 ["OBJ-001", "SUCCESSORS", "2023-01-01", "2023-12-31", "20", "SRC-01", "PUBLIC"],
                 ["OBJ-001", "SUCCESSORS", "2024-01-01", "2024-12-31", "14", "SRC-01", "PUBLIC"]],
        "note": "object_external_code dan source_code harus sudah diimpor · satu baris = satu indikator di satu periode",
    },
}


def build(name, cols, rows, note):
    widths = [max(len(c), *(len(r[i]) for r in rows)) * CW + 2 * PAD for i, (c, _) in enumerate(cols)]
    extra = (MINW - sum(widths)) / len(widths) if sum(widths) < MINW else 0  # tabel sempit: lebarkan kolom merata
    widths = [x + extra for x in widths]
    w, h = int(sum(widths)), RH * (len(rows) + 1) + 66
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" role="img" aria-label="Contoh format CSV {name}">',
         f'<rect width="{w}" height="{h}" rx="10" fill="#fff" stroke="#cbd5e1"/>']
    x = 0
    for i, (c, req) in enumerate(cols):
        s.append(f'<rect x="{x}" y="0" width="{widths[i]}" height="{RH}" fill="{"#142038" if req else "#64748b"}"/>')
        s.append(f'<text x="{x + PAD}" y="22" fill="#fff" font-weight="700">{escape(c)}</text>')
        x += widths[i]
    for r, row in enumerate(rows):
        y = RH * (r + 1)
        s.append(f'<rect x="0" y="{y}" width="{w}" height="{RH}" fill="{"#f8fafc" if r % 2 else "#fff"}"/>')
        x = 0
        for i, v in enumerate(row):
            s.append(f'<text x="{x + PAD}" y="{y + 22}" fill="#1e293b">{escape(v)}</text>')
            x += widths[i]
    y = RH * (len(rows) + 1)
    for i, (txt, color) in enumerate([("Kolom gelap = wajib · kolom abu = opsional", "#475569"), (note, "#475569"),
                                      ("Contoh format saja, bukan data sungguhan. Isi dengan data nyata yang punya sumber.", "#94a3b8")]):
        s.append(f'<text x="{PAD}" y="{y + 20 + 17 * i}" font-family="system-ui, sans-serif" font-size="12" fill="{color}">{escape(txt)}</text>')
    s.append("</svg>")
    return "\n".join(s)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in EXAMPLES.items():
        (OUT / f"{k}.svg").write_text(build(k, v["cols"], v["rows"], v["note"]), encoding="utf-8")
        print("ok", k)
