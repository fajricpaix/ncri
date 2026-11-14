# Data NCRI

| File | Asal | Catatan |
|---|---|---|
| `export/*.csv` | **PARTNER** (sementara) | Ekspor 14 Nov 2026: `data_sources.csv` (5 sumber), `cultural_objects.csv` (67 objek), `observations.csv` (2.233 baris). Upload lewat Data Submission berurutan: sumber, objek, observasi. Angka belum diverifikasi; ganti `data_origin` dan sumber sesuai asal sebenarnya sebelum dipakai sebagai dasar keputusan. |

Setiap dataset baru wajib dicatat di tabel ini: sumber, tanggal ambil, lisensi/izin, status verifikasi.

| `apps/web/public/geo/idn-adm1.json` | **PUBLIC** | Batas 34 provinsi. Sumber: geoBoundaries gbOpen IDN ADM1 (build 2023-12, data OpenStreetMap/Wambacher tahun 2017), lisensi **ODbL 1.0** (© OpenStreetMap contributors). Diambil 2026-11-12 dari `github.com/wmgeolab/geoBoundaries` (commit 9469f09), dipangkas oleh `scripts/prepare_geo.py`. Atribusi tampil di peta. **Batas 2017**: Papua Selatan, Tengah, Pegunungan (pemekaran 2022) tergambar sebagai Papua; Papua Barat Daya tergambar sebagai Papua Barat. Turunan data ini mengikuti syarat ODbL (share-alike). |


| `apps/web/public/objects/*.jpg` | **PUBLIC** (lisensi per gambar) | Thumbnail objek budaya dari gambar utama artikel Wikipedia, diambil `scripts/fetch_object_images.py`. Halaman sumber per gambar ada di `manifest.json`; lisensi (CC/domain publik) dan atribusi mengikuti halaman sumber tersebut. |
