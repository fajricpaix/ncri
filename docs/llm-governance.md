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
| `anthropic` | Anthropic Messages API, tool use dengan JSON schema. Butuh `LLM_API_KEY`; model via `LLM_MODEL` |

Kunci API hanya ada di backend. **Provider `anthropic` baru diuji dengan transport tiruan, belum dengan API sungguhan.**

## Yang disimpan per analisis
Provider, model, `prompt_version`, snapshot input, output, evidence refs, status review, waktu review, dan baris `audit_logs`.

## Batas yang diketahui
- Reviewer tercatat (`reviewed_by` + audit log); belum ada aturan "pembuat ≠ penyetuju" bila satu orang berperan ganda (mis. Admin).
- Rate limit in-memory per proses (10/menit/IP).
- `POST /llm/assistant` (tanya-jawab) belum ada.
- Belum ada RAG dokumen/pgvector; konteks murni dari tabel NCRI.
- Sebelum memakai provider eksternal pada data nyata: tetapkan kebijakan data, lokasi pemrosesan, dan biaya (blueprint §21).
