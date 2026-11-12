# NCRI — National Cultural Risk Intelligence

Monorepo: `apps/web` (Next.js) + `services/api` (FastAPI).

## Jalankan lokal
```bash
# Database (PostGIS) — butuh Docker Desktop
docker compose -f infra/docker-compose.yml up -d
cd services/api && source .venv/bin/activate && alembic upgrade head && python -m app.seed && pytest -q && cd ../..
# API (Python 3.11)
cd services/api && uvicorn app.main:app --reload --port 8000
# Web
cd apps/web && cp .env.example .env.local && npm run dev
```
Demo juri: `docs/demo-script.md` (reset data: `cd services/api && python -m app.demo_reset`). Bukti kriteria MVP: `docs/acceptance-mvp.md`.
Peta & laporan: `/risk-map`, `/reports` (ekspor CSV + cetak PDF). Sumber peta & lisensi: `data/README.md`.
Login demo (hanya development): `admin|analyst|reviewer|viewer@ncri.local`, kata sandi `ncri-demo-123`. Lihat `docs/auth-rbac.md`.
Web: http://localhost:3000 · API docs: http://localhost:8000/docs
