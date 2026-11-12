# Memory project
## Keputusan yang sudah dibuat
- Monorepo: apps/web (Next.js 16, cache components aktif, fetch dinamis harus di dalam Suspense) + services/api (FastAPI)
- Logo SVG di apps/web/public/brand/ (ncri-logo.svg, ncri-icon.svg), tiap bagian punya id untuk animasi Lottie
## Progres
- Sprint 0 selesai: web + API health check terhubung, build/lint/tsc lolos
- Sprint 1 selesai: shell (sidebar/topbar responsif), Executive Overview (data SIMULATED di features/overview/data.ts), login UI demo, 9 halaman placeholder. Peta masih placeholder (Sprint 5). Auth belum sungguhan
- Sprint 2 (sisi backend) selesai: Postgres+PostGIS via docker (image amd64, jalan emulasi di Apple Silicon), Alembic migrasi 1, seed 38 provinsi + 7 indikator + 5 objek SIMULATED, API regions/indicators/data-sources/cultural-objects/data-imports (CSV dry-run lalu commit=true, upsert idempotent), 3 tes importer. Tabel risk/LLM/early-warning sengaja belum dibuat (Sprint 3/4)
- Sprint 3 selesai: app/risk.py (baseline-0.1, fungsi murni, 6 tes), risk_service (run + simpan + early warning, idempotent), endpoint /analytics/risk/run, /cultural-objects/{id}/risk, /early-warnings (+PATCH), /dashboard/overview. UI: Overview dari API, panel risiko di detail objek, halaman /early-warnings. Migrasi 2. Metodologi di docs/risk-methodology.md
- Sprint 4 selesai: app/llm/ (provider adapter: fake|anthropic, schemas, guardrails, prompts v1, orchestrator), endpoint /llm/risk-explanation|root-cause|recommendations, /cultural-objects/{id}/analyses, /llm/analyses/{id}/review, /recommendations (+review). Migrasi 3. UI: panel AI Insight di detail objek + halaman /recommendations. 15 tes. Docs: docs/llm-governance.md. services/api/.env lokal berisi LLM_PROVIDER=fake (gitignored)
- Provider anthropic BELUM diuji dengan API sungguhan (hanya MockTransport). Assistant Q&A (/llm/assistant) dan RAG belum ada
- Auth+RBAC selesai: cookie httpOnly JWT (app/auth.py), role ADMIN/ANALYST/REVIEWER/VIEWER, matriks di docs/auth-rbac.md, CSRF header X-NCRI-Client, proxy.ts, login nyata + chip akun demo (NEXT_PUBLIC_DEMO_LOGINS), halaman Settings (user admin + audit log), reviewer tercatat. Migrasi 4. 23 tes. Akun demo hanya development (admin|analyst|reviewer|viewer@ncri.local / ncri-demo-123)
- Client component pakai apiFetch (lib/api-client), server component pakai api()/serverFetch (lib/api-server). Server component yang baca cookie wajib di dalam Suspense
- Sprint 5 selesai: peta MapLibre per provinsi (/risk-map + peta di Overview, tanpa tile pihak ketiga; GeoJSON 34 provinsi batas 2017 dari geoBoundaries ODbL di public/geo, dibuat scripts/prepare_geo.py; pemekaran Papua digabung ke induk via MAP_PARENT), API /map/provinces, /reports/executive?province=, /reports/objects.csv, /reports/early-warnings.csv (anti CSV-injection, label SIMULATED), halaman /reports cetak/PDF via window.print. 26 tes. Worker MapLibre disalin ke public/vendor oleh postinstall (Turbopack tidak membundel worker)
- Warna peta = rata-rata skor objek (bisa menyembunyikan 1 objek HIGH); PDF = print browser, bukan PDF server
- Tooling selesai: git init (branch main) + commit awal eaa881b (belum ada remote, belum di-push); .github/workflows/ci.yml (api: pytest + alembic upgrade head + seed di PostGIS; web: lint, typegen+tsc, build). Sudah diverifikasi di klon bersih (npm ci, venv baru, migrasi dari DB kosong). apps/web/.gitignore sempat mengabaikan .env.example, sudah diperbaiki
- Review keamanan otomatis pasca-commit: 2 temuan MEDIUM sudah diperbaiki (belum di-commit): token_version untuk revokasi sesi (migrasi 5) dan rate limit IP via TRUSTED_PROXY_HOPS + kunci per-akun. 31 tes
- UI mockup (sebagian): header per-halaman (ikon+judul+subjudul dari nav.ts), ilustrasi senja+candi, batik di sidebar, tab anchor di Overview, delta KPI dari 2 periode penilaian nyata. TIDAK ditiru dari mockup: angka (4.862, 86.431, 215 program) karena data karangan; tab Program & Dampak dan Insight AI nasional belum ada datanya
- Bug yang sudah ditemukan & diperbaiki: bulk delete() melewati cascade ORM (FK violation) -> hapus lewat db.delete(obj)
- Logo: hasil trace otomatis (vtracer) dari PNG asli user (design/ncri-logo-original.png) lewat scripts/build_logo.py -> public/brand/ncri-logo.svg, ncri-icon.svg, ncri-icon-dark.svg (navy diterangkan untuk latar gelap). Layer bernama: flag-red/white, emblem-gold/navy, wordmark-letters (8 path: N,C,R,I + lubang), subtitle, tagline; teks SUDAH jadi path. Warna bendera hasil trace agak oranye (gradasi asli)
## Hal yang harus diingat
- UI Sprint 2 selesai: /cultural-objects (list), /cultural-objects/[id] (grafik+tabel observasi), /data-sources (upload CSV: validasi -> preview error -> konfirmasi impor), error.tsx. Teruji di browser. 
- CRUD objek di UI (form tambah/edit) belum ada, hanya via API POST
- Saat tes lokal di port selain 3000, set CORS_ORIGINS di API, kalau tidak browser 'Failed to fetch'
- Belum: reset sandi, MFA, lockout per akun, aturan pembuat≠penyetuju
- Bobot, ambang (70/40), skala penurunan 50% = contoh demo, WAJIB divalidasi ahli
- Bobot indikator di seed.py = contoh blueprint, wajib divalidasi ahli
- Logo siap untuk Lottie (semua path). Layer emblem-gold terdiri 184 path kecil: untuk animasi halus mungkin perlu digabung per bagian di editor
