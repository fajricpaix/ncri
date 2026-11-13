# Naskah Demo untuk Juri (±8 menit)

Mengikuti blueprint §16. Seluruh data = **SIMULATED**; katakan ini di awal.

## Persiapan (sekali, ±2 menit)
```bash
docker compose -f infra/docker-compose.yml up -d
cd services/api && source .venv/bin/activate
alembic upgrade head && python -m app.demo_reset      # data awal bersih (aman diulang kapan saja)
uvicorn app.main:app --port 8000 &                     # API
cd ../../apps/web && yarn dev                       # web di http://localhost:3000
```
Buka halaman login; tombol **Admin / Analyst / Reviewer / Viewer** mengisi akun demo. Siapkan dua jendela: Analyst dan Reviewer.
Opsional AI sungguhan: isi `LLM_PROVIDER=anthropic` + `LLM_API_KEY` di `services/api/.env`. Tanpa itu, AI = contoh deterministik yang **berlabel "bukan AI"**.

## Alur
| # | Aksi (role) | Yang ditunjukkan | Kalimat kunci |
|---|---|---|---|
| 1 | **Overview** (Viewer) | KPI, donut, tren, baris sumber/periode/metode | "5 dari 6 objek dinilai. Satu objek datanya kurang, jadi kami tidak memaksa klasifikasi." |
| 2 | **Peta**: klik Jawa Barat | Warna per provinsi, panel detail, tabel | "Warna = rata-rata skor objek; rinciannya ada di panel supaya satu objek berisiko tinggi tidak tersembunyi." |
| 3 | **Cultural Objects → Tari Topeng Cirebon** | Profil + grafik indikator 2022–2024 | "Semua angka bisa ditelusuri ke observasi dan sumbernya." |
| 4 | **Hitung ulang risiko** (Analyst) | Skor 95, tabel faktor: perubahan %, bobot, kontribusi | "Skor = jumlah bobot × risiko tiap indikator. Tidak ada kotak hitam." |
| 5 | Data confidence 0,55 + komponen | Skor dan confidence dipisah | "Risiko tinggi, tetapi bukti kami lemah (belum terverifikasi, satu sumber). Dua hal itu berbeda." |
| 6 | **AI Insight → Jelaskan risiko** (Analyst) | Draft + jumlah bukti + keterbatasan | "AI hanya menjelaskan; ia tidak menghitung skor dan tidak boleh mengarang bukti." |
| 7 | **Hipotesis akar masalah** | Badge "HIPOTESIS · perlu validasi", bukti yang masih kurang | "Ini hipotesis, bukan sebab-akibat." |
| 8 | **Draft rekomendasi** | Tindakan, sasaran, KPI, horizon | "Statusnya DRAFT sampai manusia menyetujui." |
| 9 | **Recommendations** (Reviewer) → Setujui | Status DISETUJUI; Analyst tidak punya tombol | "Pembuat dan penyetuju dipisah." |
| 10 | **Early Warning** → Tinjau / Selesai | Sinyal perubahan tajam, verifikasi | "Ini sinyal untuk diperiksa, bukan bukti budaya terancam." |
| 11 | **Reports** → pilih Jawa Tengah → Cetak/PDF, unduh CSV | Banner SIMULATED, metodologi, batasan | "Setiap ekspor membawa label simulasi dan metodenya." |
| 12 | **Settings** (Admin) | Audit log: siapa melakukan apa | "Semua tindakan penting tercatat atas nama pengguna." |

## Pertanyaan yang mungkin muncul — jawab jujur
- **"Apakah ini data resmi?"** Tidak. Semua angka simulasi untuk demo teknis. Arsitektur siap menerima CSV/API resmi (import + provenance sudah ada).
- **"Mana prediksinya?"** Sengaja belum ditampilkan: butuh data historis nyata dan validasi ahli (Sprint 6). Yang ada adalah tren deskriptif + skor baseline.
- **"Bobot dan ambang dari mana?"** Asumsi demo (blueprint §7.1), belum divalidasi ahli. Tersimpan per penilaian supaya bisa direproduksi dan diganti.
- **"Apakah AI-nya sungguhan?"** Tergantung konfigurasi. Label di layar selalu menyebut penyedia; tanpa API key, label "CONTOH DETERMINISTIK · bukan AI".
- **"Bagaimana mencegah AI berhalusinasi?"** Konteks hanya data NCRI; referensi bukti divalidasi terhadap observasi yang dikirim; output yang mengarang bukti ditolak dan tidak bisa disetujui.
- **"Peta Papua?"** Batas 2017; provinsi pemekaran digambar oleh induknya (tertulis di peta).

## Setelah demo
`python -m app.demo_reset` mengembalikan semuanya ke awal.
