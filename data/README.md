# Data NCRI

| File | Asal | Catatan |
|---|---|---|
| `sample/observations.csv` | **SIMULATED** | Angka sintetis buatan sendiri untuk demo teknis. Bukan data resmi. Nilai indikator 5 objek (nama objek memang nyata, angkanya tidak). |

Setiap dataset baru wajib dicatat di tabel ini: sumber, tanggal ambil, lisensi/izin, status verifikasi.

| `apps/web/public/geo/idn-adm1.json` | **PUBLIC** | Batas 34 provinsi. Sumber: geoBoundaries gbOpen IDN ADM1 (build 2023-12, data OpenStreetMap/Wambacher tahun 2017), lisensi **ODbL 1.0** (© OpenStreetMap contributors). Diambil 2026-11-12 dari `github.com/wmgeolab/geoBoundaries` (commit 9469f09), dipangkas oleh `scripts/prepare_geo.py`. Atribusi tampil di peta. **Batas 2017**: Papua Selatan, Tengah, Pegunungan (pemekaran 2022) tergambar sebagai Papua; Papua Barat Daya tergambar sebagai Papua Barat. Turunan data ini mengikuti syarat ODbL (share-alike). |

| (database) data contoh lengkap | **SIMULATED** | Dibuat `services/api/app/sample_catalog.py` (generator deterministik, seed 2026) dan dimuat `python -m app.sample_data`. 61 objek budaya (nama objek nyata, **semua angka karangan**), ±2.150 observasi 2019–2024 dari 4 sumber simulasi (`SIM-DAPOBUD`, `SIM-SURVEI`, `SIM-KOMUNITAS`, `SIM-BPS`), 26 provinsi. Lintasan sengaja dirancang: ada yang menurun curam, stabil, membaik, berjeda (gap), dan data kurang. Bukan kondisi sebenarnya. |
