# Model Card — Prediksi Risiko Keberlangsungan Budaya

**Status: TIDAK DIVALIDASI. Tidak ada model prediksi yang aktif dan tidak ada angka prediksi yang ditampilkan.**
Terakhir diperbarui: 2026-11-12. Kode kerangka: `services/api/app/ml/readiness.py` (tes: `tests/test_readiness.py`); halaman: Predictive Analytics.

## Tujuan penggunaan
Memberi sinyal dini kepada analis kebijakan tentang objek yang berpeluang masuk kelas HIGH pada periode berikutnya, untuk prioritas pemeriksaan. **Bukan** untuk menetapkan kebijakan atau klaim ilmiah bahwa suatu budaya akan punah.

## Target (PROVISIONAL, belum disetujui ahli)
`event = 1` bila skor risiko `baseline-0.1` periode t+1 ≥ 70. Catatan penting: target ini **dihitung dari skor baseline yang bobotnya sendiri belum divalidasi**, sehingga model belajar menirukan formula, bukan fenomena budaya. Sebelum model apa pun dipercaya, target perlu didefinisikan ulang bersama ahli (mis. dari penilaian lapangan atau status inventaris yang terverifikasi).

## Data
- Saat ini: data hasil impor CSV belum diverifikasi lapangan. Tidak cukup untuk melatih model; gerbang validasi tetap menolak.
- Dibutuhkan (usulan awal, untuk dibahas dengan ahli statistik): ≥ 30 objek, ≥ 5 periode per objek, ≥ 100 pasangan periode, ≥ 15 kejadian HIGH, ≥ 30 pasangan uji. Dicek otomatis dan ditampilkan di halaman Predictive Analytics.

## Protokol evaluasi
1. **Pemisahan temporal**: latih pada masa lalu, uji pada periode terbaru. Diuji bahwa tidak ada kebocoran (semua periode uji lebih baru dari periode latih).
2. **Baseline wajib**: persistensi ("status sekarang = berikutnya"). Model hanya layak bila Brier-nya lebih baik ≥ 0,05 pada data uji.
3. **Metrik**: Brier (probabilistik), AUC, MAE skor, tabel kalibrasi. Satu angka akurasi tidak cukup karena kelas HIGH langka.
4. Celah data (periode tanpa skor) memutus runtun; tidak diisi nol atau diinterpolasi.
5. **Gerbang** (`gate()`): prediksi hanya boleh tampil bila semua syarat data terpenuhi, target disetujui ahli (`PREDICTION_TARGET_VALIDATED`), dan model mengalahkan baseline pada data uji. Gerbang ini diuji, termasuk kasus data besar tetapi model tidak lebih baik dari baseline.

## Model
Belum ada. Library ML (scikit-learn/XGBoost) sengaja belum dipasang; ditambahkan setelah data memadai. Kandidat awal: regresi logistik atas fitur perubahan antar periode (mudah dijelaskan) sebelum model yang lebih kompleks.

## Bias dan keterbatasan yang sudah diketahui
- **Bias cakupan**: data dari wilayah/komunitas yang lebih aktif mendata (urban, terdigitalisasi) akan lebih banyak; objek terpencil bisa tampak "stabil" hanya karena jarang dicatat.
- **Perubahan metode pendataan** bisa tampak sebagai penurunan nyata. Perbandingan hanya untuk periode setara, tetapi perubahan definisi indikator tidak terdeteksi otomatis.
- **Kelas langka**: sedikit kejadian HIGH membuat estimasi tidak stabil.
- **Umpan balik**: bila prediksi dipakai mengarahkan intervensi, data berikutnya ikut berubah (tidak dimodelkan).
- **Korelasi ≠ sebab**: tidak ada klaim kausal.
- **Data belum terverifikasi**: tidak ada kesimpulan ilmiah yang boleh ditarik dari angka yang belum diverifikasi.

## Yang perlu dilakukan sebelum prediksi boleh tampil
1. Kumpulkan data historis nyata (sumber & izin tercatat di `data/README.md`).
2. Tetapkan target bersama ahli dan set `PREDICTION_TARGET_VALIDATED=true` dengan catatan keputusan.
3. Latih model kandidat dan evaluasi sesuai protokol; lampirkan hasil di dokumen ini.
4. Bila gerbang lulus: tampilkan prediksi dengan interval/ketidakpastian, label versi model, dan batasan di samping angkanya.
