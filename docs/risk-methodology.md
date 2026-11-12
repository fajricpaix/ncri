# Metodologi Risiko — `baseline-0.1`

> **Status: asumsi demo.** Semua bobot, ambang, dan skala di bawah belum divalidasi ahli. Jangan dipakai untuk keputusan nyata sebelum divalidasi (blueprint §21).

Kode: `services/api/app/risk.py` (fungsi murni, diuji di `tests/test_risk.py`).

## 1. Skor risiko (0–100; 0 = baik, 100 = mengkhawatirkan)
Per indikator berbobot (bobot > 0):
1. Ambil satu observasi per periode (utamakan `VERIFIED`, lalu yang terbaru). Nilai kosong = gap, tidak dianggap nol.
2. Bandingkan dua periode terakhir. Panjang periode harus setara (selisih ≤ 10 hari), kalau tidak indikator dilewati.
3. `perubahan% = (terbaru − sebelumnya) / |sebelumnya| × 100`. Untuk `LOWER_IS_WORSE`, penurunan = buruk.
4. `risiko_indikator = clamp(penurunan% / 50 × 100, 0, 100)` → penurunan 50% = 100.

`risk_score = Σ risiko_indikator × bobot`. Bila ada indikator yang tidak tersedia, bobot **dinormalisasi ulang** atas indikator yang tersedia (dan completeness turun, sehingga confidence ikut turun).

Klasifikasi: `HIGH ≥ 70`, `MEDIUM ≥ 40`, selain itu `LOW`.
**`INSUFFICIENT_DATA`** bila indikator tersedia < 3 atau mencakup < 60% total bobot. Skor dibiarkan kosong, tidak dipaksakan.

## 2. Data confidence (0–1, terpisah dari skor)
Rata-rata empat komponen: `completeness` (porsi bobot yang tersedia), `freshness` (1 bila data ≤ 1 tahun, turun linear ke 0 pada 4 tahun), `verification` (porsi observasi terverifikasi), `sources` (1 bila ≥ 2 sumber independen, 0,5 bila hanya 1).

## 3. Early warning
| Aturan | Tingkat |
|---|---|
| Level `HIGH` | HIGH |
| Indikator turun ≥ 40% (risiko indikator ≥ 80) | MEDIUM — sinyal anomali, bisa akibat perubahan metode pendataan |
| Level HIGH/MEDIUM tetapi confidence < 0,6 | LOW — perlu verifikasi data |

Tidak membuat duplikat selama peringatan sama masih `OPEN`/`IN_REVIEW`.

## 4. Reproduksibilitas
Tiap penilaian menyimpan `method_version`, bobot yang dipakai per faktor, parameter (`explanation_json.params`), dan id observasi bukti.

## 5. Batas yang diketahui
- Hanya tren dua periode terakhir; belum memakai tingkat absolut (mis. jumlah penerus sangat kecil).
- Peringatan lama tidak otomatis ditutup ketika kondisi membaik.
- Belum ada prediksi (Sprint 6, butuh data historis & validasi).
