# Acceptance Criteria MVP — Bukti

Sumber kriteria: blueprint §17. Dijalankan 2026-11-12 dengan `scripts/acceptance_check.py` pada data hasil `python -m app.demo_reset` (LLM_PROVIDER=fake): **27/27 pemeriksaan lolos**.

Ulangi: lihat header `scripts/acceptance_check.py`.

| # | Kriteria | Bukti | Catatan / batas bukti |
|---|---|---|---|
| 1 | Semua angka dashboard punya sumber & periode | Overview menampilkan sumber, periode penilaian, metode; peta/laporan memuat periode | Sebelum pemeriksaan ini, Overview belum menampilkan sumber/periode: celah ditemukan dan ditutup |
| 2 | Data simulasi selalu berlabel | Badge di header & Overview, `data_origin` di API, kolom `asal_data`/`is_simulated` di CSV, banner di laporan | Pemeriksaan UI = pencarian kode, bukan uji visual otomatis (dicek manual lewat screenshot) |
| 3 | Import CSV + kesalahan validasi | Baris salah dilaporkan per baris/kolom, tidak diimpor; unit test `test_importer.py` | |
| 4 | Profil objek + riwayat indikator | 15 observasi per objek contoh, grafik + tabel | |
| 5 | Skor dapat direproduksi | Skor = Σ kontribusi; bobot ternormalisasi; metode+parameter+id bukti tersimpan; hitung ulang identik | |
| 6 | Data kurang → `INSUFFICIENT_DATA` | Objek Reog Ponorogo | |
| 7 | Skor & confidence terpisah | Dua nilai, dua tampilan, komponen confidence | |
| 8 | Early warning dapat ditinjau/ditutup oleh yang berwenang | Viewer 403; Analyst/Reviewer 200 | |
| 9 | LLM hanya menerima konteks yang diizinkan | Kunci snapshot persis `{object, assessment, observations, open_warnings}`; tanpa email/data pengguna | |
| 10 | Output LLM divalidasi schema | Pydantic + guardrail; `test_llm.py` | |
| 11 | Klaim penting punya evidence ref | Semua ref ⊆ id observasi objek; ref karangan ditolak (unit test + uji di DB) | **Diuji dengan provider `fake`**; perilaku model nyata belum diuji |
| 12 | Hipotesis ditandai | `validation_needed` selalu true (dipaksa guardrail) | |
| 13 | Rekomendasi draft sampai disetujui manusia | DRAFT; Analyst 403; Reviewer 200 | |
| 14 | API key tak pernah di browser | 26 berkas bundel web dipindai; tidak ada `NEXT_PUBLIC_*KEY`; respons API bersih | Pemindaian berbasis pola |
| 15 | Audit log tindakan penting | login, import, hitung risiko, peringatan, generate AI, review; hanya Admin yang membaca | |
| 16 | Demo berjalan end-to-end lokal | Skrip menjalankan alur 4 role; naskah di `docs/demo-script.md` | Butir ini hanya merangkum butir lain (bukan bukti independen) |

## Yang pemeriksaan ini TIDAK membuktikan
- Kebenaran ilmiah skor (bobot/ambang belum divalidasi ahli).
- Kualitas keluaran model AI nyata; provider `anthropic` belum dijalankan dengan kunci sungguhan.
- Uji beban, keamanan penetrasi, aksesibilitas penuh (hanya praktik dasar: label teks selain warna, `aria`, tabel pendamping peta).
- Keandalan di perangkat/peramban lain selain yang dicoba (Chromium).
