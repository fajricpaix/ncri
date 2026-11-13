# Tata Kelola LLM

Kode: `services/api/app/llm/`. Terakhir diperbarui: 2026-11-12.

## Peran
LLM hanya **menjelaskan**, menyusun **hipotesis**, dan membuat **draft rekomendasi**. LLM tidak menghitung atau mengubah skor risiko, dan tidak mengisi data yang hilang.

## Alur
`POST /llm/{risk-explanation|root-cause|recommendations}` → bangun konteks dari DB (objek, penilaian + faktor, observasi, peringatan terbuka; tanpa data pribadi) → panggil provider → validasi schema (Pydantic) → **guardrail** → simpan `llm_analyses` sebagai `DRAFT` → tinjauan manusia oleh role Reviewer/Admin (`/llm/analyses/{id}/review`, `/recommendations/{id}/review`).

## Guardrail (`guardrails.py`)
- Semua `evidence_refs` harus id observasi yang ada pada konteks yang dikirim; referensi karangan → **ditolak**.
- Faktor risiko dan tindakan wajib punya bukti; `limitations` wajib terisi; bagian utama tiap jenis analisis tidak boleh kosong.
- `validation_needed` pada hipotesis selalu dipaksa `true`.
- Output yang ditolak tetap disimpan (status `REJECTED` + `validation_errors`) untuk audit dan tidak bisa disetujui.
- Objek `INSUFFICIENT_DATA` tidak dianalisis (409).

## Provider (`provider.py`)
| `LLM_PROVIDER` | Perilaku |
|---|---|
| kosong | LLM nonaktif, endpoint 503 |
| `fake` | Keluaran deterministik tanpa jaringan, untuk dev/tes. Selalu berlabel "bukan AI" di UI |
| `gemini` | Google Gemini (free tier, AI Studio): `generateContent` dengan `responseJsonSchema`, kunci di header `x-goog-api-key`. Default model `gemini-2.5-flash`. Diuji dengan transport tiruan saja |
| `anthropic` | Anthropic Messages API, tool use dengan JSON schema. Butuh `LLM_API_KEY`; model via `LLM_MODEL` |

Kunci API hanya ada di backend. **Admin mengisi penyedia/model/kunci di Settings > Pengaturan LLM** (`/admin/llm-settings`, tes koneksi di `/test`): disimpan di tabel `app_settings`, kunci dienkripsi Fernet dari `AUTH_SECRET` (ganti AUTH_SECRET = kunci harus diisi ulang), tidak pernah dikirim balik ke UI (hanya 4 karakter terakhir), tidak masuk audit log. Pengaturan DB menimpa env. **Provider `anthropic` baru diuji dengan transport tiruan, belum dengan API sungguhan.**

## Yang disimpan per analisis
Provider, model, `prompt_version`, snapshot input, output, evidence refs, status review, waktu review, dan baris `audit_logs`.

## Batas yang diketahui
- Reviewer tercatat (`reviewed_by` + audit log); belum ada aturan "pembuat ≠ penyetuju" bila satu orang berperan ganda (mis. Admin).
- Rate limit in-memory per proses (10/menit/IP).
- Asisten tanya-jawab (`POST /llm/assistant`): cakupan nasional/provinsi/objek (maks. 25 objek per konteks, ditandai `truncated`), hanya Analyst/Reviewer/Admin, riwayat hanya milik penanya. Bukti = `assessment:<id objek>` atau id observasi; jawaban tanpa bukti ditolak kecuali `answerable=false`. Pertanyaan dan teks data diperlakukan sebagai DATA (instruksi di dalamnya diabaikan lewat system prompt). **Ketahanan terhadap prompt injection pada model nyata belum diuji**; guardrail hanya menjamin referensi bukti, bukan kebenaran isi jawaban.
- Belum ada RAG dokumen/pgvector; konteks murni dari tabel NCRI.
- Sebelum memakai provider eksternal pada data nyata: tetapkan kebijakan data, lokasi pemrosesan, dan biaya (blueprint §21).
