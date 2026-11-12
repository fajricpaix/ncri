"""Kembalikan data demo ke kondisi awal dengan satu perintah: python -m app.demo_reset
Hanya APP_ENV=development. Menghapus observasi, penilaian, peringatan, analisis AI, rekomendasi, dan audit log;
mempertahankan akun & referensi (provinsi, indikator). Lalu seed -> import CSV contoh -> hitung risiko,
lewat jalur API yang sama dengan pemakaian nyata."""
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import text

from app import seed
from app.config import settings
from app.db import engine

SAMPLE = Path(__file__).resolve().parents[3] / "data" / "sample" / "observations.csv"
H = {"X-NCRI-Client": "web"}


def main():
    if settings.app_env != "development":
        sys.exit("demo_reset hanya untuk APP_ENV=development")
    with engine.begin() as c:
        c.execute(text("TRUNCATE audit_logs, early_warnings, policy_recommendations, llm_analyses, "
                       "risk_assessment_factors, risk_assessments, indicator_observations, data_import_jobs "
                       "RESTART IDENTITY CASCADE"))
    seed.run()
    from app.main import app  # impor di sini agar check_secret berjalan setelah guard di atas
    api = settings.api_v1_prefix
    with TestClient(app, base_url="http://localhost") as c:
        r = c.post(f"{api}/auth/login", headers=H, json={"email": "analyst@ncri.local", "password": "ncri-demo-123"})
        r.raise_for_status()
        imp = c.post(f"{api}/data-imports/csv?commit=true", headers=H, files={"file": ("observations.csv", SAMPLE.read_bytes(), "text/csv")})
        imp.raise_for_status()
        run = c.post(f"{api}/analytics/risk/run", headers=H, json={})
        run.raise_for_status()
    print("demo siap:", imp.json()["records_valid"], "observasi diimpor;", run.json())


if __name__ == "__main__":
    main()
