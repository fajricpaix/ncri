# NCRI --- National Cultural Risk Intelligence

## Technical Blueprint & Implementation Guide (Next.js)

**Tagline:** Predicting Cultural Decline Before It Disappears.\
**Dokumen:** Blueprint teknis untuk eksekusi di VS Code\
**Versi:** 0.1 --- MVP kompetisi\
**Status:** Rancangan awal; sesuaikan setelah validasi kebutuhan
kompetisi dan akses data.

------------------------------------------------------------------------

## 1. Visi Produk

NCRI adalah platform intelligence untuk membantu pemerintah mendeteksi,
menganalisis, dan memprediksi risiko menurunnya keberlangsungan budaya
Indonesia. Sistem mengintegrasikan data kebudayaan, data historis,
demografi pelaku, aktivitas, lokasi, dan regenerasi; menjalankan
predictive analytics; lalu menyajikan klasifikasi risiko dan rekomendasi
pelestarian.

NCRI **bukan** platform media sosial dan **bukan** sekadar katalog
budaya. Produk utamanya adalah Admin Dashboard untuk analisis dan
pengambilan keputusan.

### 1.1 Tujuan utama

1.  Mengidentifikasi objek/komunitas budaya yang menunjukkan indikator
    penurunan.
2.  Mengukur tingkat risiko secara transparan.
3.  Menganalisis tren dan memprediksi potensi penurunan jika data
    historis memadai.
4.  Mendeteksi anomali pada indikator yang dipantau.
5.  Menjelaskan faktor risiko dan menyajikan hipotesis akar masalah
    berbasis bukti.
6.  Memberikan rekomendasi intervensi yang dapat divalidasi oleh
    ahli/pemerintah.
7.  Memantau perubahan indikator setelah intervensi.

### 1.2 Alur kerja inti

``` text
DATA SOURCES
DAPOBUD / SPKT / Pemda / Komunitas / Survei Lapangan
        |
        v
BIG DATA INTEGRATION
Import -> Validation -> Cleaning -> Standardization -> Historical Records
        |
        v
AI & PREDICTIVE ANALYTICS
Risk Scoring -> Trend Analysis -> Decline Prediction -> Anomaly Detection
        |
        v
RISK CLASSIFICATION
HIGH RISK | MEDIUM RISK | LOW RISK
        |
        v
NATIONAL CULTURAL RISK DASHBOARD
Risk Mapping -> Early Warning -> Preservation Recommendation -> Monitoring
```

LLM berada sebagai lapisan intelligence yang membantu menjelaskan hasil
analitik, menyusun hipotesis akar masalah, menjawab pertanyaan berbasis
data, dan membuat draft rekomendasi. LLM **tidak** menjadi satu-satunya
penentu risk score.

------------------------------------------------------------------------

## 2. Prinsip Produk dan Batasan MVP

### 2.1 Prinsip

-   Evidence-first: setiap insight harus bisa ditelusuri ke indikator
    dan sumber data.
-   Data provenance: simpan sumber, tanggal pengambilan, lisensi/izin,
    metode import, dan status verifikasi.
-   No fabricated data: data simulasi harus diberi label `SIMULATED` di
    UI, API, ekspor, dan laporan.
-   Human-in-the-loop: rekomendasi LLM adalah draft untuk ditinjau
    manusia, bukan keputusan otomatis.
-   Explainability: setiap risk score memiliki komponen, bobot, periode,
    dan kualitas data.
-   Privacy by design: hindari data pribadi yang tidak dibutuhkan;
    gunakan agregat bila memungkinkan.
-   Platform-neutral: integrasi pemerintah dilakukan melalui API/dataset
    yang diizinkan, bukan asumsi akses internal.
-   Modular: social listening/NLP media sosial bukan ketergantungan MVP.
    Dapat ditambahkan kemudian sebagai sumber tambahan yang patuh aturan
    platform.

### 2.2 Scope MVP kompetisi

**Masuk MVP** - Admin authentication dan role sederhana. - Executive
Overview. - Peta risiko Indonesia (data provinsi/kabupaten yang
tersedia). - Direktori objek budaya dan halaman detail. - Data Sources
dan import CSV. - Indikator historis dan grafik tren. - Risk scoring
transparan berbasis aturan/baseline. - Klasifikasi High / Medium /
Low. - Early warning. - LLM Risk Explanation dan draft Preservation
Recommendation berbasis konteks data. - Laporan ringkas dan audit log.

**Di luar MVP / fase lanjutan** - Integrasi API privat pemerintah
sebelum ada izin. - Social listening lintas platform. - Prediksi
nasional yang diklaim tervalidasi tanpa dataset historis yang memadai. -
Otomasi pengiriman rekomendasi sebagai keputusan resmi. - Aplikasi
mobile petugas lapangan. - Policy simulator kuantitatif sebelum tersedia
model dampak yang tervalidasi.

------------------------------------------------------------------------

## 3. Arsitektur Teknologi

### 3.1 Stack yang disarankan

  -----------------------------------------------------------------------
  Layer                   Teknologi               Tanggung jawab
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js App Router +    Admin dashboard
                          TypeScript              

  UI                      Tailwind CSS +          Komponen dan layout
                          shadcn/ui               

  Charts                  Apache ECharts          Grafik tren dan
                                                  indikator

  Map                     MapLibre GL JS          Peta risiko

  Backend API             Python FastAPI          Business logic dan API

  Validation              Pydantic                Validasi
                                                  request/response

  Database                PostgreSQL              Data operasional

  Geospatial              PostGIS                 Geometri wilayah dan
                                                  peta

  ORM/migrations          SQLAlchemy + Alembic    Model dan migrasi
                                                  Python

  Background jobs         Redis + Celery/RQ       Import dan analitik
                                                  async

  ML                      pandas, scikit-learn;   Risk scoring/prediksi
                          XGBoost bila layak      

  LLM                     Provider adapter        Explanation, RAG,
                          (GPT/Claude/local)      recommendations

  Vector search           pgvector                Retrieval dokumen

  File storage            S3-compatible storage / Dataset dan dokumen
                          local dev               

  Deployment demo         Vercel (web) + hosting  Demo kompetisi
                          Python/Postgres         
  -----------------------------------------------------------------------

**Catatan:** Next.js adalah frontend utama. Jangan memindahkan
perhitungan ML ke browser. Semua analitik dan akses data berjalan di
backend.

### 3.2 Diagram arsitektur

``` text
                   +-----------------------------+
                   |       NEXT.JS ADMIN         |
                   | Overview / Map / Objects    |
                   | Risk / Alerts / Reports     |
                   | Data Sources / AI Assistant |
                   +--------------+--------------+
                                  |
                             HTTPS / REST
                                  |
                   +--------------v--------------+
                   |          FASTAPI            |
                   | Auth / RBAC / CRUD / API    |
                   | Analytics / LLM Orchestrator|
                   +---+------------+---------+--+
                       |            |         |
             +---------v--+   +-----v----+  +-v----------------+
             | PostgreSQL |   | Redis    |  | LLM Provider     |
             | + PostGIS  |   | Job Queue|  | Adapter          |
             | + pgvector|   +-----+----+  +------------------+
             +------------+         |
                                    v
                           +------------------+
                           | Background Worker|
                           | ETL / Risk / NLP  |
                           | Report / RAG      |
                           +--------+---------+
                                    |
                    +---------------v----------------+
                    | Approved data sources/files    |
                    | DAPOBUD/SPKT exports, BPS,     |
                    | local government, surveys      |
                    +--------------------------------+
```

------------------------------------------------------------------------

## 4. Repository Structure

Gunakan monorepo agar frontend dan backend berada dalam satu repository,
tetapi tetap terpisah.

``` text
ncri/
├── apps/
│   └── web/                         # Next.js Admin Dashboard
│       ├── public/
│       │   ├── images/
│       │   └── geo/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   └── login/page.tsx
│       │   │   ├── (dashboard)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx     # Executive Overview
│       │   │   │   ├── risk-map/page.tsx
│       │   │   │   ├── cultural-objects/page.tsx
│       │   │   │   ├── cultural-objects/[id]/page.tsx
│       │   │   │   ├── analytics/page.tsx
│       │   │   │   ├── early-warnings/page.tsx
│       │   │   │   ├── recommendations/page.tsx
│       │   │   │   ├── ai-assistant/page.tsx
│       │   │   │   ├── data-sources/page.tsx
│       │   │   │   ├── reports/page.tsx
│       │   │   │   └── settings/page.tsx
│       │   │   ├── api/             # Optional Next route handlers/BFF
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── dashboard/
│       │   │   ├── maps/
│       │   │   ├── charts/
│       │   │   ├── tables/
│       │   │   ├── risk/
│       │   │   ├── ai/
│       │   │   └── ui/
│       │   ├── features/
│       │   │   ├── overview/
│       │   │   ├── cultural-objects/
│       │   │   ├── risk-analysis/
│       │   │   ├── recommendations/
│       │   │   └── data-sources/
│       │   ├── lib/
│       │   │   ├── api-client.ts
│       │   │   ├── auth.ts
│       │   │   ├── formatters.ts
│       │   │   └── validators.ts
│       │   ├── hooks/
│       │   ├── types/
│       │   └── middleware.ts
│       ├── .env.example
│       ├── package.json
│       └── tsconfig.json
├── services/
│   └── api/                          # FastAPI backend
│       ├── app/
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   └── logging.py
│       │   ├── api/v1/
│       │   │   ├── router.py
│       │   │   └── endpoints/
│       │   ├── models/               # SQLAlchemy models
│       │   ├── schemas/              # Pydantic schemas
│       │   ├── repositories/
│       │   ├── services/
│       │   │   ├── data_ingestion/
│       │   │   ├── analytics/
│       │   │   ├── risk/
│       │   │   ├── recommendations/
│       │   │   └── reporting/
│       │   ├── ml/
│       │   │   ├── features/
│       │   │   ├── scoring/
│       │   │   ├── prediction/
│       │   │   └── anomaly/
│       │   ├── llm/
│       │   │   ├── provider.py
│       │   │   ├── prompts/
│       │   │   ├── schemas.py
│       │   │   ├── orchestrator.py
│       │   │   ├── retrieval.py
│       │   │   └── guardrails.py
│       │   ├── workers/
│       │   └── utils/
│       ├── alembic/
│       ├── tests/
│       ├── pyproject.toml
│       └── .env.example
├── data/
│   ├── sample/                       # Clearly marked synthetic samples
│   ├── imports/
│   └── README.md                     # Source, license, provenance register
├── docs/
│   ├── architecture.md
│   ├── data-dictionary.md
│   ├── risk-methodology.md
│   ├── llm-governance.md
│   └── api-contract.md
├── infra/
│   ├── docker-compose.yml
│   └── postgres/
├── scripts/
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 5. Modul Admin Dashboard

### 5.1 Navigasi

  -----------------------------------------------------------------------
  Menu                                Isi
  ----------------------------------- -----------------------------------
  Executive Overview                  KPI nasional, distribusi risiko,
                                      tren, alert terbaru

  National Risk Map                   Peta provinsi/kabupaten dan filter
                                      risiko

  Cultural Objects                    Direktori objek budaya dan profil

  Predictive Analytics                Tren indikator, prediksi,
                                      confidence/quality

  Early Warning                       Daftar perubahan indikator yang
                                      perlu ditinjau

  Root Cause & Recommendations        Bukti, hipotesis penyebab, tindakan

  AI Assistant                        Tanya jawab berbasis data NCRI

  Data Sources                        Sumber, konektor, import CSV,
                                      status kualitas

  Reports                             Laporan nasional/daerah dan ekspor

  Settings                            User, role, audit, konfigurasi
  -----------------------------------------------------------------------

### 5.2 Executive Overview

Komponen minimum: - Total objek budaya yang terdaftar di dataset NCRI. -
Jumlah objek dengan data cukup untuk dinilai. - Distribusi High / Medium
/ Low Risk. - Peta risiko Indonesia. - Tren jumlah indikator yang
memburuk. - Early warning terbaru. - Top 10 objek yang perlu ditinjau. -
Data freshness dan data completeness.

Jangan menampilkan angka nasional seolah-olah lengkap bila cakupan data
hanya pilot atau dataset simulasi. Tampilkan badge `PUBLIC`,
`SIMULATED`, atau `PARTNER DATA`.

### 5.3 Detail objek budaya

Halaman detail minimal memuat: - Nama dan kategori objek budaya. -
Lokasi dan wilayah administrasi. - Sumber data dan status verifikasi. -
Profil komunitas/pelaku dalam bentuk agregat. - Grafik indikator
historis. - Risk score dan komponennya. - Faktor yang mendorong skor. -
Prediksi (jika data cukup). - Penjelasan LLM dengan evidence
references. - Rekomendasi dan status review manusia.

------------------------------------------------------------------------

## 6. Data Model / Database Schema

Gunakan PostgreSQL + PostGIS. Nama tabel menggunakan `snake_case`. Semua
tabel penting memiliki `created_at` dan `updated_at`.

### 6.1 Tabel inti

#### `users`

-   `id` UUID PK
-   `name` VARCHAR
-   `email` VARCHAR UNIQUE
-   `password_hash` VARCHAR (jika auth dikelola sendiri)
-   `role` ENUM: `ADMIN`, `ANALYST`, `REVIEWER`, `VIEWER`
-   `is_active` BOOLEAN
-   timestamps

#### `regions`

-   `id` UUID PK
-   `code` VARCHAR UNIQUE
-   `name` VARCHAR
-   `level` ENUM: `PROVINCE`, `REGENCY`, `DISTRICT`, `VILLAGE`
-   `parent_id` UUID FK nullable
-   `geometry` GEOMETRY(MultiPolygon, 4326) nullable
-   timestamps

#### `cultural_objects`

-   `id` UUID PK
-   `external_code` VARCHAR nullable
-   `name` VARCHAR
-   `category` VARCHAR
-   `description` TEXT nullable
-   `region_id` UUID FK nullable
-   `latitude` NUMERIC nullable
-   `longitude` NUMERIC nullable
-   `inventory_status` VARCHAR
-   `verification_status` ENUM: `UNVERIFIED`, `VERIFIED`, `REJECTED`
-   `data_origin` ENUM: `PUBLIC`, `SIMULATED`, `PARTNER`
-   `source_id` UUID FK nullable
-   timestamps

#### `data_sources`

-   `id` UUID PK
-   `name` VARCHAR
-   `source_type` ENUM: `GOVERNMENT`, `COMMUNITY`, `SURVEY`,
    `PUBLIC_DATA`, `MANUAL`
-   `description` TEXT nullable
-   `access_method` VARCHAR
-   `terms_url` TEXT nullable
-   `license_notes` TEXT nullable
-   `is_active` BOOLEAN
-   timestamps

#### `data_import_jobs`

-   `id` UUID PK
-   `source_id` UUID FK
-   `file_name` VARCHAR nullable
-   `status` ENUM: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
-   `records_total` INTEGER
-   `records_success` INTEGER
-   `records_failed` INTEGER
-   `error_summary` TEXT nullable
-   `started_at`, `finished_at` TIMESTAMP nullable
-   `created_by` UUID FK

#### `indicators`

-   `id` UUID PK
-   `code` VARCHAR UNIQUE
-   `name` VARCHAR
-   `description` TEXT
-   `unit` VARCHAR nullable
-   `direction` ENUM: `LOWER_IS_WORSE`, `HIGHER_IS_WORSE`,
    `TARGET_RANGE`
-   `default_weight` NUMERIC
-   `is_active` BOOLEAN

#### `indicator_observations`

-   `id` UUID PK
-   `cultural_object_id` UUID FK
-   `indicator_id` UUID FK
-   `period_start` DATE
-   `period_end` DATE
-   `value_numeric` NUMERIC nullable
-   `value_text` TEXT nullable
-   `sample_size` INTEGER nullable
-   `source_id` UUID FK
-   `import_job_id` UUID FK nullable
-   `verification_status` ENUM
-   `data_origin` ENUM: `PUBLIC`, `SIMULATED`, `PARTNER`
-   `notes` TEXT nullable
-   `created_at` TIMESTAMP

Unique constraint:
`(cultural_object_id, indicator_id, period_start, period_end, source_id)`.

#### `risk_assessments`

-   `id` UUID PK
-   `cultural_object_id` UUID FK
-   `assessment_date` DATE
-   `period_start` DATE
-   `period_end` DATE
-   `risk_score` NUMERIC (0--100)
-   `risk_level` ENUM: `HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_DATA`
-   `method_version` VARCHAR
-   `data_quality_score` NUMERIC nullable
-   `explanation_json` JSONB
-   `is_simulated` BOOLEAN
-   `created_at` TIMESTAMP

#### `risk_assessment_factors`

-   `id` UUID PK
-   `risk_assessment_id` UUID FK
-   `indicator_id` UUID FK
-   `normalized_value` NUMERIC
-   `weight_used` NUMERIC
-   `weighted_contribution` NUMERIC
-   `direction` VARCHAR
-   `evidence_observation_ids` JSONB

#### `predictions`

-   `id` UUID PK
-   `cultural_object_id` UUID FK
-   `target_indicator_id` UUID FK nullable
-   `generated_at` TIMESTAMP
-   `horizon_months` INTEGER
-   `predicted_value` NUMERIC nullable
-   `prediction_low` NUMERIC nullable
-   `prediction_high` NUMERIC nullable
-   `model_name` VARCHAR
-   `model_version` VARCHAR
-   `confidence_note` TEXT
-   `is_simulated` BOOLEAN

#### `early_warnings`

-   `id` UUID PK
-   `cultural_object_id` UUID FK
-   `risk_assessment_id` UUID FK nullable
-   `severity` ENUM: `HIGH`, `MEDIUM`, `LOW`
-   `title` VARCHAR
-   `description` TEXT
-   `triggered_by_json` JSONB
-   `status` ENUM: `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`
-   `assigned_to` UUID FK nullable
-   `created_at`, `resolved_at` TIMESTAMP nullable

#### `llm_analyses`

-   `id` UUID PK
-   `cultural_object_id` UUID FK nullable
-   `risk_assessment_id` UUID FK nullable
-   `analysis_type` ENUM: `RISK_EXPLANATION`, `ROOT_CAUSE`,
    `RECOMMENDATION`, `REPORT`, `ASSISTANT`
-   `provider` VARCHAR
-   `model` VARCHAR
-   `prompt_version` VARCHAR
-   `input_snapshot` JSONB
-   `output_json` JSONB
-   `evidence_refs` JSONB
-   `review_status` ENUM: `DRAFT`, `APPROVED`, `REJECTED`
-   `reviewed_by` UUID FK nullable
-   `reviewed_at` TIMESTAMP nullable
-   timestamps

#### `policy_recommendations`

-   `id` UUID PK
-   `cultural_object_id` UUID FK
-   `risk_assessment_id` UUID FK nullable
-   `title` VARCHAR
-   `problem_statement` TEXT
-   `root_cause_hypotheses` JSONB
-   `recommended_actions` JSONB
-   `target_groups` JSONB
-   `suggested_kpis` JSONB
-   `evidence_refs` JSONB
-   `status` ENUM: `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`,
    `IMPLEMENTED`
-   `created_by_type` ENUM: `LLM`, `HUMAN`
-   `reviewed_by` UUID FK nullable
-   timestamps

#### `audit_logs`

-   `id` UUID PK
-   `user_id` UUID FK nullable
-   `action` VARCHAR
-   `entity_type` VARCHAR
-   `entity_id` UUID nullable
-   `metadata` JSONB
-   `ip_hash` VARCHAR nullable
-   `created_at` TIMESTAMP

### 6.2 Relasi ringkas

``` text
regions 1---N cultural_objects
data_sources 1---N cultural_objects
data_sources 1---N indicator_observations
cultural_objects 1---N indicator_observations
indicators 1---N indicator_observations
cultural_objects 1---N risk_assessments
risk_assessments 1---N risk_assessment_factors
cultural_objects 1---N predictions
cultural_objects 1---N early_warnings
risk_assessments 1---N llm_analyses
cultural_objects 1---N policy_recommendations
users 1---N audit_logs
```

### 6.3 Indikator awal

Mulai dengan indikator yang benar-benar bisa dikumpulkan. Contoh
kandidat:

  -------------------------------------------------------------------------
  Kode                      Indikator               Interpretasi risiko
  ------------------------- ----------------------- -----------------------
  `ACTIVE_PRACTITIONERS`    Jumlah pelaku aktif     Penurunan dapat
                                                    menaikkan risiko

  `SUCCESSORS`              Jumlah penerus/peserta  Nilai rendah dapat
                            belajar                 menaikkan risiko

  `ACTIVITY_FREQUENCY`      Frekuensi kegiatan per  Penurunan dapat
                            periode                 menaikkan risiko

  `ACTIVE_COMMUNITIES`      Jumlah komunitas aktif  Penurunan dapat
                                                    menaikkan risiko

  `KNOWLEDGE_TRANSFER`      Aktivitas pewarisan     Nilai rendah dapat
                            pengetahuan             menaikkan risiko

  `TRAINING_PARTICIPANTS`   Peserta pelatihan       Tren dapat menunjukkan
                                                    regenerasi

  `DATA_FRESHNESS_DAYS`     Umur data sejak         Data usang menurunkan
                            pembaruan               confidence, bukan
                                                    otomatis menaikkan
                                                    risiko budaya
  -------------------------------------------------------------------------

Jangan menganggap seluruh indikator tersedia pada sumber pemerintah.
Buat data dictionary dan tandai indikator `AVAILABLE`, `PARTIAL`, atau
`NOT_AVAILABLE`.

------------------------------------------------------------------------

## 7. Risk Scoring & Predictive Analytics

### 7.1 Mulai dengan baseline yang transparan

Untuk MVP, gunakan weighted rule-based scoring yang dapat diaudit.
Jangan mengklaim model machine learning sudah memprediksi kepunahan
secara ilmiah jika belum ada data historis berlabel dan validasi ahli.

Contoh bobot awal untuk prototipe (harus divalidasi bersama ahli):

  Indikator                Bobot contoh
  ---------------------- --------------
  Tren pelaku aktif                 25%
  Regenerasi/penerus                25%
  Frekuensi aktivitas               20%
  Komunitas aktif                   15%
  Transfer pengetahuan              15%

Setiap indikator dinormalisasi menjadi skor risiko 0--100: - 0 = kondisi
relatif baik. - 100 = kondisi sangat mengkhawatirkan.

Rumus:

``` text
risk_score = SUM(normalized_indicator_risk * indicator_weight)
```

Klasifikasi contoh: - `HIGH`: score \>= 70 - `MEDIUM`: score \>= 40 and
\< 70 - `LOW`: score \< 40 - `INSUFFICIENT_DATA`: indikator minimum
tidak terpenuhi

Ambang dan bobot di atas hanya baseline demo. Simpan `method_version`,
bobot, dan ambang agar hasil bisa direproduksi.

### 7.2 Data quality / confidence

Jangan menyamakan risk score dengan confidence.

Tampilkan dua hal terpisah: - **Risk score:** seberapa besar risiko
menurut metodologi saat ini. - **Data confidence:** seberapa lengkap,
mutakhir, dan terverifikasi bukti yang mendukung skor.

Contoh komponen kualitas: - Kelengkapan indikator. - Kemutakhiran
observasi. - Jumlah sumber independen. - Status verifikasi. -
Konsistensi periode.

Jika data tidak cukup, tampilkan `INSUFFICIENT_DATA`, bukan memaksakan
klasifikasi.

### 7.3 Trend analysis

-   Bandingkan periode yang setara (misalnya tahun ke tahun).
-   Tampilkan data hilang sebagai gap, jangan mengisi nol.
-   Tampilkan perubahan absolut dan persentase.
-   Bedakan penurunan nyata dari perubahan metode pendataan.

### 7.4 Decline prediction

Aktifkan prediksi hanya jika jumlah titik historis, kualitas, dan
konsistensi data mencukupi. Simpan horizon, model version, interval
prediksi, dan keterbatasan. Jika tidak, tampilkan "data historis belum
cukup untuk prediksi" dan gunakan trend descriptive saja.

### 7.5 Anomaly detection

Deteksi perubahan yang tidak biasa pada indikator, misalnya penurunan
tajam jumlah aktivitas. Anomali adalah sinyal untuk pemeriksaan, bukan
bukti bahwa budaya terancam.

------------------------------------------------------------------------

## 8. LLM Intelligence Engine

### 8.1 Tanggung jawab LLM

1.  Risk Explanation --- menjelaskan faktor yang membentuk risk score.
2.  Root Cause Hypotheses --- menyusun hipotesis penyebab dari bukti
    yang tersedia.
3.  Preservation Recommendations --- membuat draft tindakan, target, dan
    KPI.
4.  NCRI Assistant --- menjawab pertanyaan berdasarkan data yang
    diizinkan.
5.  Report Generation --- menyusun ringkasan laporan eksekutif.
6.  Document Intelligence --- membantu mengekstrak informasi dari
    dokumen yang sah digunakan.

### 8.2 Bukan tanggung jawab LLM

-   Mengarang atau mengisi data yang hilang.
-   Menentukan risk score final tanpa metodologi terukur.
-   Menyatakan korelasi sebagai sebab-akibat.
-   Menetapkan kebijakan atau mengirim instruksi pemerintah secara
    otomatis.
-   Menghasilkan klaim tanpa evidence reference.

### 8.3 RAG

Gunakan Retrieval-Augmented Generation (RAG) untuk mengambil konteks
dari: - Profil objek budaya. - Observasi indikator dan tren. - Risk
assessment dan faktor pembentuk skor. - Dokumen kebijakan yang telah
disetujui. - Laporan komunitas/survei yang lolos validasi.

Alur:

``` text
User question
   -> Authenticate and authorize
   -> Identify object/region/time scope
   -> Retrieve permitted records + relevant documents
   -> Build evidence context
   -> Call LLM with strict JSON schema
   -> Validate output and evidence references
   -> Store draft
   -> Human review
   -> Display approved/draft status
```

Gunakan pgvector jika dokumen dan kebutuhan semantic search sudah ada.
Untuk MVP kecil, RAG dapat dimulai dengan pencarian SQL + pencarian teks
sebelum vector search ditambahkan.

### 8.4 Output JSON LLM

Minta model menghasilkan struktur terkontrol seperti:

``` json
{
  "summary": "Ringkasan kondisi berdasarkan bukti yang tersedia.",
  "risk_drivers": [
    {
      "factor": "Regenerasi rendah",
      "evidence_refs": ["observation-uuid"],
      "interpretation": "Jumlah penerus tercatat rendah pada periode pengamatan.",
      "confidence": "medium"
    }
  ],
  "root_cause_hypotheses": [
    {
      "hypothesis": "Kesempatan belajar rutin mungkin terbatas.",
      "supporting_evidence": ["observation-uuid"],
      "missing_evidence": ["Jadwal pelatihan komunitas"],
      "confidence": "low",
      "validation_needed": true
    }
  ],
  "recommended_actions": [
    {
      "action": "Fasilitasi program belajar bersama maestro.",
      "target_group": "Komunitas dan calon penerus",
      "suggested_kpis": ["Peserta aktif", "Peserta yang bertahan setelah 6 bulan"],
      "time_horizon": "6-12 bulan",
      "evidence_refs": ["observation-uuid"]
    }
  ],
  "limitations": [
    "Data aktivitas komunitas belum lengkap."
  ]
}
```

Validasi JSON menggunakan Pydantic. Tolak atau tandai output jika
referensi bukti tidak ditemukan pada input yang diberikan.

### 8.5 LLM provider adapter

Buat interface provider agar aplikasi tidak terkunci pada satu vendor:

``` python
from typing import Protocol, Any

class LLMProvider(Protocol):
    async def generate_structured(
        self,
        system_prompt: str,
        user_payload: dict[str, Any],
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        ...
```

Implementasi provider dapat diganti melalui environment variable. API
key hanya berada di backend, tidak pernah dikirim ke browser.

### 8.6 Prompt governance

Setiap analisis menyimpan: - Provider dan model. - Prompt version. -
Timestamp. - Snapshot data input. - Evidence references. - Output
JSON. - Status review manusia.

Tambahkan instruksi eksplisit pada system prompt: - Gunakan hanya data
yang diberikan. - Jangan menebak angka atau fakta. - Bedakan fakta,
inferensi, dan hipotesis. - Sebutkan data yang hilang. - Jangan
mengklaim sebab-akibat tanpa desain penelitian yang mendukung. -
Sertakan evidence reference untuk setiap klaim penting. - Jika bukti
tidak cukup, katakan tidak cukup.

------------------------------------------------------------------------

## 9. API Contract Awal

Prefix: `/api/v1`

  -------------------------------------------------------------------------------------
  Method                  Endpoint                              Fungsi
  ----------------------- ------------------------------------- -----------------------
  GET                     `/dashboard/overview`                 KPI ringkasan

  GET                     `/regions`                            Daftar wilayah

  GET                     `/regions/{id}/risk-summary`          Ringkasan risiko
                                                                wilayah

  GET                     `/cultural-objects`                   Pencarian objek budaya

  POST                    `/cultural-objects`                   Buat objek manual

  GET                     `/cultural-objects/{id}`              Detail objek

  GET                     `/cultural-objects/{id}/indicators`   Riwayat indikator

  GET                     `/cultural-objects/{id}/risk`         Hasil risk assessment

  POST                    `/analytics/risk/run`                 Jalankan scoring

  POST                    `/analytics/prediction/run`           Jalankan prediksi bila
                                                                data cukup

  GET                     `/early-warnings`                     Daftar peringatan

  PATCH                   `/early-warnings/{id}`                Update status
                                                                peringatan

  POST                    `/data-imports/csv`                   Upload CSV

  GET                     `/data-imports/{id}`                  Status import

  POST                    `/llm/risk-explanation`               Generate penjelasan

  POST                    `/llm/root-cause`                     Generate hipotesis akar
                                                                masalah

  POST                    `/llm/recommendations`                Generate draft
                                                                rekomendasi

  POST                    `/llm/assistant`                      Tanya jawab berbasis
                                                                data

  POST                    `/recommendations/{id}/review`        Approve/reject draft

  GET                     `/reports`                            Daftar laporan

  POST                    `/reports/generate`                   Generate laporan

  GET                     `/health`                             Health check
  -------------------------------------------------------------------------------------

### Contoh response risk

``` json
{
  "cultural_object_id": "uuid",
  "assessment_date": "2026-01-01",
  "risk_score": 72.4,
  "risk_level": "HIGH",
  "data_confidence": 0.81,
  "method_version": "baseline-0.1",
  "is_simulated": true,
  "factors": [
    {
      "indicator": "SUCCESSORS",
      "normalized_risk": 85,
      "weight": 0.25,
      "contribution": 21.25
    }
  ]
}
```

------------------------------------------------------------------------

## 10. Data Ingestion & Import

### 10.1 Sumber awal

-   DAPOBUD/SPKT: gunakan hanya informasi, ekspor, atau API yang memang
    tersedia dan diizinkan.
-   Pemerintah daerah: dataset atau laporan yang diberikan secara resmi.
-   BPS: statistik relevan yang dapat digunakan sesuai ketentuan.
-   Komunitas: survei dan data aktivitas dengan persetujuan yang sesuai.
-   Data simulasi: untuk demo teknis, diberi label jelas.

Jangan mengasumsikan akses database internal, endpoint privat, atau API
pemerintah. Ajukan permohonan akses/dokumentasi kepada pengelola data.

### 10.2 CSV import pipeline

``` text
Upload CSV
 -> Validate file type and size
 -> Parse headers
 -> Map columns to NCRI data dictionary
 -> Validate rows and region/object references
 -> Show preview + validation errors
 -> User confirms import
 -> Store raw file + provenance
 -> Normalize and upsert records
 -> Run data quality checks
 -> Queue analytics job
 -> Show import summary
```

### 10.3 Contoh format CSV observasi

``` csv
object_external_code,indicator_code,period_start,period_end,value_numeric,source_code,data_origin
OBJ-001,ACTIVE_PRACTITIONERS,2024-01-01,2024-12-31,45,SURVEY-01,SIMULATED
OBJ-001,SUCCESSORS,2024-01-01,2024-12-31,8,SURVEY-01,SIMULATED
OBJ-001,ACTIVITY_FREQUENCY,2024-01-01,2024-12-31,12,SURVEY-01,SIMULATED
```

Sertakan template CSV yang dapat diunduh dari halaman Data Sources.

------------------------------------------------------------------------

## 11. Security, Privacy, dan Governance

-   Gunakan HTTPS pada deployment.
-   Password disimpan dalam bentuk hash yang kuat; jangan simpan
    plaintext.
-   Terapkan RBAC: Admin, Analyst, Reviewer, Viewer.
-   Validasi seluruh input di backend.
-   Batasi ukuran dan tipe file upload.
-   Simpan API key di secret manager/environment backend.
-   Jangan mengirim data pribadi sensitif ke LLM tanpa dasar dan
    kebutuhan yang sah.
-   Terapkan minimisasi data dan agregasi.
-   Catat audit log untuk import, perubahan, generate AI,
    approve/reject.
-   Terapkan rate limit pada endpoint LLM.
-   Pisahkan dataset simulasi dan data aktual.
-   Tampilkan sumber dan tanggal pembaruan pada insight.
-   Minta human approval sebelum rekomendasi dianggap resmi.
-   Tetapkan masa retensi dan prosedur penghapusan data sesuai
    ketentuan.

------------------------------------------------------------------------

## 12. Desain UI / UX

### 12.1 Arah visual

-   Tipe: Government Intelligence Dashboard.
-   Desktop-first, tetap responsive.
-   Layout sidebar kiri + topbar + content area.
-   Gunakan visual yang profesional, tenang, dan mudah dibaca.
-   Hindari terlalu banyak kartu dekoratif.
-   Prioritaskan peta, tren, status risiko, kualitas data, dan evidence.

### 12.2 Warna status

-   High Risk: merah lembut.
-   Medium Risk: amber.
-   Low Risk: hijau.
-   Insufficient Data: abu-abu.
-   Simulated Data: badge khusus yang selalu terlihat.

Jangan mengandalkan warna saja; selalu sertakan label teks/icon.

### 12.3 Overview layout

``` text
+--------------------------------------------------------------+
| NCRI | National Cultural Risk Intelligence       User/Profile|
+---------------+----------------------------------------------+
| Sidebar       | Executive Overview                           |
|               | [Total Objects] [High] [Medium] [Low]         |
| Overview      |                                              |
| Risk Map      | [National Risk Map        ] [Risk Distribution]|
| Objects       |                                              |
| Analytics     | [Risk Trend Chart                         ]  |
| Early Warning |                                              |
| Recommendations| [Priority Objects Table                  ]  |
| AI Assistant | [Recent Alerts] [Data Quality / Freshness]    |
| Data Sources  |                                              |
| Reports       |                                              |
+---------------+----------------------------------------------+
```

------------------------------------------------------------------------

## 13. Environment Variables

### `apps/web/.env.example`

``` env
NEXT_PUBLIC_APP_NAME=NCRI
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### `services/api/.env.example`

``` env
APP_ENV=development
APP_NAME=NCRI API
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+psycopg://ncri:ncri_dev_password@localhost:5432/ncri
REDIS_URL=redis://localhost:6379/0

# Select provider in backend. Keep secrets server-side.
LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=

# Optional object storage
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

CORS_ORIGINS=http://localhost:3000
```

Jangan commit file `.env` ke Git. Commit hanya `.env.example`.

------------------------------------------------------------------------

## 14. Local Development Setup

### Prerequisites

-   Node.js LTS
-   npm
-   Python 3.11+
-   PostgreSQL dengan PostGIS
-   Redis (untuk background jobs)
-   Git
-   VS Code

### 14.1 Buat Next.js app

Dari root repository:

``` bash
mkdir -p ncri/apps
cd ncri/apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd web
```

Install library frontend:

``` bash
npm install echarts echarts-for-react maplibre-gl lucide-react zod
```

Komponen UI dapat ditambahkan dengan shadcn/ui mengikuti dokumentasi
resminya.

### 14.2 Siapkan FastAPI

Dari root repository:

``` bash
mkdir -p services/api
cd services/api
python -m venv .venv
source .venv/bin/activate
```

Install dependency awal:

``` bash
pip install fastapi uvicorn[standard] pydantic-settings sqlalchemy alembic psycopg[binary] python-multipart pandas scikit-learn redis
pip freeze > requirements.txt
```

Buat `app/main.py`:

``` python
from fastapi import FastAPI

app = FastAPI(
    title="NCRI API",
    version="0.1.0",
    description="National Cultural Risk Intelligence API",
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "ncri-api"}
```

Jalankan:

``` bash
uvicorn app.main:app --reload --port 8000
```

Dokumentasi API tersedia di `http://localhost:8000/docs`.

### 14.3 PostgreSQL dan Redis

Untuk development, jalankan PostgreSQL/PostGIS dan Redis secara lokal
atau melalui Docker Compose. Pastikan extension PostGIS dan pgvector
tersedia pada image/database yang dipilih sebelum menjalankan migration.

Contoh SQL awal:

``` sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

`vector` hanya diperlukan ketika fitur semantic retrieval mulai
dibangun.

### 14.4 Jalankan frontend

``` bash
cd apps/web
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

------------------------------------------------------------------------

## 15. Urutan Implementasi yang Disarankan

### Sprint 0 --- Project foundation

-   [ ] Buat repository monorepo.
-   [ ] Setup Next.js dan FastAPI.
-   [ ] Setup PostgreSQL/PostGIS.
-   [ ] Setup linting, formatting, dan environment.
-   [ ] Buat health check frontend/backend.
-   [ ] Siapkan README dan dokumentasi.

**Definition of done:** frontend dan backend dapat dijalankan lokal dan
saling terhubung.

### Sprint 1 --- Admin Dashboard shell

-   [ ] Login UI dan role model.
-   [ ] Sidebar/topbar.
-   [ ] Executive Overview dengan data contoh berlabel simulasi.
-   [ ] Komponen KPI, chart, table.
-   [ ] Responsive desktop/tablet.

**Definition of done:** juri dapat menavigasi dashboard dan memahami
ringkasan NCRI.

### Sprint 2 --- Data foundation

-   [ ] Buat schema database.
-   [ ] Jalankan Alembic migrations.
-   [ ] Seed wilayah dan indikator.
-   [ ] CRUD objek budaya.
-   [ ] Data Sources page.
-   [ ] CSV upload, preview, validation, import.
-   [ ] Data provenance dan status simulasi.

**Definition of done:** analis dapat memasukkan dataset dan melihat
riwayat indikator objek budaya.

### Sprint 3 --- Risk analytics

-   [ ] Normalisasi indikator.
-   [ ] Implementasikan baseline weighted scoring.
-   [ ] Simpan faktor dan bobot yang digunakan.
-   [ ] Data confidence/completeness.
-   [ ] Risk classification.
-   [ ] Trend chart.
-   [ ] Early warning rules.

**Definition of done:** satu objek budaya dapat dinilai dan hasilnya
dapat dijelaskan dari faktor pembentuk skor.

### Sprint 4 --- LLM Intelligence

-   [ ] Buat provider adapter.
-   [ ] Buat Pydantic output schemas.
-   [ ] Risk explanation.
-   [ ] Root cause hypotheses.
-   [ ] Preservation recommendation.
-   [ ] Evidence reference validation.
-   [ ] Draft/review/approve workflow.
-   [ ] Simpan prompt version dan output.

**Definition of done:** LLM menghasilkan draft insight berdasarkan data
NCRI yang diberikan, menyebut keterbatasan, dan tidak mengarang
referensi.

### Sprint 5 --- Map and reporting

-   [ ] Peta risiko dengan filter wilayah.
-   [ ] Detail objek dari peta.
-   [ ] Executive report.
-   [ ] Export PDF/CSV.
-   [ ] Audit logs.
-   [ ] Demo scenario end-to-end.

**Definition of done:** alur demo dari data sampai rekomendasi dapat
ditunjukkan tanpa mengandalkan klaim integrasi yang belum tersedia.

### Sprint 6 --- Predictive model validation

-   [ ] Kumpulkan data historis yang cukup.
-   [ ] Definisikan target prediksi dengan ahli.
-   [ ] Pisahkan train/validation/test secara temporal.
-   [ ] Bandingkan baseline dengan model ML.
-   [ ] Evaluasi calibration dan error.
-   [ ] Dokumentasikan bias, keterbatasan, dan model card.

**Definition of done:** prediksi hanya ditampilkan jika lolos kriteria
validasi yang disepakati.

------------------------------------------------------------------------

## 16. Demo Story untuk Juri

Gunakan satu skenario demonstrasi yang konsisten:

1.  Buka Executive Overview dan jelaskan cakupan dataset.
2.  Pilih provinsi pada National Risk Map.
3.  Pilih satu objek budaya berlabel data simulasi atau dataset publik
    yang jelas sumbernya.
4.  Tampilkan tren jumlah pelaku, regenerasi, aktivitas, dan komunitas.
5.  Jalankan risk assessment dan tunjukkan skor beserta bobot.
6.  Tampilkan data confidence dan indikator yang belum tersedia.
7.  Minta LLM menjelaskan faktor risiko dengan evidence references.
8.  Minta LLM membuat hipotesis akar masalah dan tandai mana yang perlu
    verifikasi.
9.  Buat draft preservation recommendation.
10. Reviewer menyetujui atau menolak rekomendasi.
11. Tampilkan early warning dan laporan.

Narasi demo: NCRI mengubah data yang tersebar menjadi sinyal risiko dan
bahan pengambilan keputusan yang dapat ditelusuri.

------------------------------------------------------------------------

## 17. Acceptance Criteria MVP

-   [ ] Semua angka dashboard memiliki sumber dan periode.
-   [ ] Dataset simulasi selalu diberi label.
-   [ ] Pengguna dapat mengimpor CSV dan melihat kesalahan validasi.
-   [ ] Objek budaya memiliki profil dan riwayat indikator.
-   [ ] Risk score dapat direproduksi dari bobot dan input yang
    tersimpan.
-   [ ] Data tidak cukup menghasilkan `INSUFFICIENT_DATA`.
-   [ ] Risk score dan data confidence ditampilkan terpisah.
-   [ ] Early warning dapat ditinjau dan ditutup oleh pengguna
    berwenang.
-   [ ] LLM hanya menerima konteks yang diizinkan.
-   [ ] Output LLM divalidasi terhadap schema.
-   [ ] Klaim penting LLM memiliki evidence references.
-   [ ] Hipotesis akar masalah ditandai sebagai hipotesis.
-   [ ] Rekomendasi LLM berstatus draft sampai disetujui manusia.
-   [ ] API key tidak pernah terekspos di browser.
-   [ ] Aplikasi memiliki audit log untuk tindakan penting.
-   [ ] Demo berjalan end-to-end secara lokal atau pada deployment demo.

------------------------------------------------------------------------

## 18. Risiko Proyek dan Mitigasi

  -----------------------------------------------------------------------
  Risiko                              Mitigasi
  ----------------------------------- -----------------------------------
  API/database pemerintah tidak       Mulai dari dataset publik, CSV, dan
  terbuka                             permohonan akses resmi

  Data historis tidak lengkap         Tampilkan tren deskriptif; jangan
                                      klaim prediksi

  Definisi indikator berbeda          Data dictionary, mapping, dan
  antarwilayah                        metadata metode

  Data simulasi disangka data nyata   Label permanen di UI, API, dan
                                      laporan

  LLM hallucination                   RAG, evidence validation,
                                      structured output, human review

  Bias data perkotaan/digital         Tambahkan survei lapangan dan data
                                      komunitas

  Risk score dianggap kebenaran       Publikasikan metodologi,
  absolut                             confidence, dan batasan

  Rekomendasi tidak sesuai konteks    Validasi ahli dan pemerintah daerah
  lokal                               
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 19. Sumber Dokumentasi Teknis

-   Next.js: https://nextjs.org/docs
-   FastAPI: https://fastapi.tiangolo.com/
-   PostgreSQL: https://www.postgresql.org/docs/
-   PostGIS: https://postgis.net/documentation/
-   SQLAlchemy: https://docs.sqlalchemy.org/
-   Alembic: https://alembic.sqlalchemy.org/
-   MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
-   Apache ECharts: https://echarts.apache.org/
-   scikit-learn: https://scikit-learn.org/stable/
-   pgvector: https://github.com/pgvector/pgvector
-   YouTube Data API (opsional fase lanjutan):
    https://developers.google.com/youtube/v3
-   X API (opsional fase lanjutan): https://developer.x.com/en/docs

------------------------------------------------------------------------

## 20. Instruksi untuk AI Coding Assistant di VS Code

Gunakan instruksi berikut sebagai prompt awal untuk coding assistant:

> Kamu adalah senior full-stack engineer yang membangun NCRI (National
> Cultural Risk Intelligence). Ikuti dokumen
> `NCRI_TECHNICAL_BLUEPRINT.md` sebagai sumber kebutuhan utama.
>
> Bangun aplikasi dengan Next.js App Router + TypeScript untuk frontend,
> FastAPI + Python untuk backend, dan PostgreSQL/PostGIS untuk database.
>
> Kerjakan secara bertahap. Mulai dari Sprint 0 saja. Sebelum menulis
> kode, periksa struktur repository dan jelaskan rencana file yang akan
> dibuat. Jangan menghapus atau mengganti file yang sudah ada tanpa
> alasan dan konfirmasi.
>
> Gunakan TypeScript strict mode, komponen reusable, validasi input,
> error handling, loading/empty states, dan aksesibilitas. Jangan
> membuat angka data nasional palsu. Data contoh harus diberi label
> `SIMULATED`.
>
> Semua risk score harus dapat ditelusuri ke indikator, bobot, periode,
> dan versi metode. Pisahkan risk score dari data confidence. Jika data
> tidak cukup, gunakan `INSUFFICIENT_DATA`.
>
> LLM hanya membuat penjelasan, hipotesis, dan rekomendasi berbasis
> konteks yang diberikan. LLM tidak boleh menentukan skor risiko final
> atau mengarang evidence. Semua rekomendasi berstatus draft sampai
> direview manusia.
>
> Setelah setiap sprint, jalankan lint, type check, test, dan verifikasi
> acceptance criteria sprint tersebut. Laporkan file yang dibuat/diubah,
> command yang dijalankan, hasil test, dan pekerjaan yang belum selesai.
> Jangan melompat ke sprint berikutnya sebelum sprint aktif stabil.

------------------------------------------------------------------------

## 21. Keputusan Arsitektur yang Perlu Divalidasi

Sebelum deployment publik atau integrasi pemerintah, validasi: 1.
Dataset dan indikator mana yang benar-benar tersedia. 2. Ketentuan
penggunaan dan izin setiap sumber data. 3. Definisi operasional "risiko
keberlangsungan budaya" bersama ahli. 4. Bobot, ambang, dan target
prediksi. 5. Kelayakan model berdasarkan data historis. 6. Provider LLM,
biaya, lokasi pemrosesan, dan kebijakan data. 7. Kebutuhan keamanan dan
tata kelola data instansi.

**Prinsip penutup:** Bangun dashboard yang dapat bekerja dengan data
yang tersedia hari ini, tetapi desain integrasi agar siap menerima data
resmi pemerintah di masa depan. NCRI harus lebih dulu membuktikan alur
`data -> evidence -> risk -> insight -> recommended action`, sebelum
memperluas cakupan fitur.
