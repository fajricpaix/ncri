"""Bukti otomatis untuk Acceptance Criteria MVP (blueprint §17) terhadap API yang sedang berjalan.

Pakai:  cd services/api && .venv/bin/python -m app.demo_reset   # data awal bersih
        .venv/bin/uvicorn app.main:app --port 8000 &            # (LLM_PROVIDER=fake)
        .venv/bin/python ../../scripts/acceptance_check.py
Butuh akun demo (APP_ENV=development). Keluar dengan kode 1 bila ada kriteria gagal."""
import glob
import re
import subprocess
import sys
from pathlib import Path

import httpx

BASE = "http://localhost:8000/api/v1"
H = {"X-NCRI-Client": "web"}
ROOT = Path(__file__).resolve().parents[1]
results: list[tuple[str, bool, str]] = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("  ✓ " if ok else "  ✗ ") + name + (f"  [{detail}]" if detail else ""))


def client(role):
    c = httpx.Client(base_url=BASE, headers=H, timeout=30)
    r = c.post("/auth/login", json={"email": f"{role}@ncri.local", "password": "ncri-demo-123"})
    assert r.status_code == 200, f"login {role}: {r.status_code}"
    return c


admin, analyst, reviewer, viewer = (client(r) for r in ("admin", "analyst", "reviewer", "viewer"))

print("1. Angka dashboard punya sumber & periode")
ov = viewer.get("/dashboard/overview").json()
check("overview memuat sumber, periode, metode", ov["sources"] and ov["latest_period_end"] and ov["method_version"],
      f"{ov['sources']} s.d. {ov['latest_period_end']} {ov['method_version']}")

print("2. Data simulasi selalu berlabel (UI/API/ekspor/laporan)")
objs = viewer.get("/cultural-objects?limit=200").json()
check("setiap objek membawa data_origin", all(o["data_origin"] for o in objs))
rep = viewer.get("/reports/executive").json()
csv_head = viewer.get("/reports/objects.csv").text.splitlines()[0]
check("overview, laporan, dan CSV menandai simulasi", ov["is_simulated"] and rep["is_simulated"] and "is_simulated" in csv_head and "asal_data" in csv_head)
web = list((ROOT / "apps/web/src").rglob("*.tsx"))
check("UI memiliki badge SIMULATED di shell & laporan", any("SimulatedBadge" in f.read_text() for f in web) and "SIMULATED —" in (ROOT / "apps/web/src/app/(dashboard)/reports/page.tsx").read_text())

print("3. Import CSV + kesalahan validasi")
bad = b"object_external_code,indicator_code,period_start,period_end,value_numeric,source_code,data_origin\nNOPE,SUCCESSORS,2024-01-01,2024-12-31,x,SIM-01,SIMULATED\n"
r = analyst.post("/data-imports/csv", files={"file": ("bad.csv", bad, "text/csv")}).json()
check("baris salah dilaporkan per baris & kolom, tidak diimpor", r["records_failed"] == 1 and {e["field"] for e in r["errors"]} >= {"object_external_code", "value_numeric"} and not r["committed"])

print("4. Profil objek + riwayat indikator")
topeng = next(o for o in objs if "Topeng" in o["name"])
hist = viewer.get(f"/cultural-objects/{topeng['id']}/indicators").json()
check("riwayat indikator tersedia", len(hist) >= 10, f"{len(hist)} observasi")

print("5. Skor risiko dapat direproduksi")
risk = viewer.get(f"/cultural-objects/{topeng['id']}/risk").json()
check("skor = jumlah kontribusi faktor (bobot × risiko)", abs(risk["risk_score"] - sum(f["contribution"] for f in risk["factors"])) < 0.1,
      f"{risk['risk_score']} vs {sum(f['contribution'] for f in risk['factors']):.2f}")
check("bobot ternormalisasi, metode & parameter tersimpan", abs(sum(f["weight"] for f in risk["factors"]) - 1) < 1e-3 and risk["method_version"] and risk["params"])
check("setiap faktor menunjuk id observasi bukti", all(len(f["evidence_observation_ids"]) == 2 for f in risk["factors"]))
before = {o["name"]: viewer.get(f"/cultural-objects/{o['id']}/risk").json().get("risk_score") if viewer.get(f"/cultural-objects/{o['id']}/risk").status_code == 200 else None for o in objs}
analyst.post("/analytics/risk/run", json={})
after = {o["name"]: viewer.get(f"/cultural-objects/{o['id']}/risk").json().get("risk_score") if viewer.get(f"/cultural-objects/{o['id']}/risk").status_code == 200 else None for o in objs}
check("hitung ulang menghasilkan skor identik (deterministik)", before == after)

print("6. Data tidak cukup => INSUFFICIENT_DATA")
check("objek tanpa observasi tidak diklasifikasi paksa", ov["distribution"]["INSUFFICIENT_DATA"] >= 1 and viewer.get(f"/cultural-objects/{next(o for o in objs if 'Reog' in o['name'])['id']}/risk").status_code == 404)

print("7. Skor risiko dan data confidence terpisah")
check("keduanya ada dan bernilai berbeda", risk["data_confidence"] is not None and risk["risk_score"] != risk["data_confidence"] and "confidence_components" in risk,
      f"skor {risk['risk_score']}, confidence {risk['data_confidence']}")

print("8. Early warning ditinjau & ditutup oleh yang berwenang")
w = viewer.get("/early-warnings").json()[0]
check("Viewer tidak boleh mengubah", viewer.patch(f"/early-warnings/{w['id']}", json={"status": "IN_REVIEW"}).status_code == 403)
a = analyst.patch(f"/early-warnings/{w['id']}", json={"status": "IN_REVIEW"})
b = reviewer.patch(f"/early-warnings/{w['id']}", json={"status": "RESOLVED"})
check("Analyst/Reviewer dapat meninjau lalu menutup", a.status_code == 200 and b.status_code == 200)

print("9-13. Lapisan LLM")
g = analyst.post("/llm/recommendations", json={"cultural_object_id": topeng["id"]}).json()
rc = analyst.post("/llm/root-cause", json={"cultural_object_id": topeng["id"]}).json()
analyses = admin.get(f"/cultural-objects/{topeng['id']}/analyses").json()
snap_keys = subprocess.run(["docker", "exec", "infra-db-1", "psql", "-U", "ncri", "-d", "ncri", "-tAc",
    "select string_agg(distinct k, ',' order by k) from llm_analyses, jsonb_object_keys(input_snapshot) k"], capture_output=True, text=True).stdout.strip()
snap_txt = subprocess.run(["docker", "exec", "infra-db-1", "psql", "-U", "ncri", "-d", "ncri", "-tAc", "select input_snapshot::text from llm_analyses limit 1"], capture_output=True, text=True).stdout
check("9  konteks LLM hanya {object, assessment, observations, open_warnings}, tanpa data pengguna", snap_keys == "assessment,object,observations,open_warnings" and "@" not in snap_txt, snap_keys)
check("10 output tersimpan dengan prompt_version, provider, model", g["prompt_version"] and g["provider"] and g["model"] and g["validation_errors"] == [])
obs_ids = {o["id"] for o in hist}
refs = set(g["evidence_refs"])
check("11 semua evidence ref ada di observasi objek (tidak ada karangan)", refs and refs <= obs_ids, f"{len(refs)} ref")
check("12 hipotesis selalu validation_needed", rc["output"]["root_cause_hypotheses"] and all(h["validation_needed"] for h in rc["output"]["root_cause_hypotheses"]))
recs = viewer.get("/recommendations").json()
mine = next(r for r in recs if r["cultural_object_id"] == topeng["id"] and r["status"] == "DRAFT")
check("13 rekomendasi LLM berstatus DRAFT", mine["status"] == "DRAFT")
check("13 Analyst tidak boleh menyetujui drafnya sendiri", analyst.post(f"/recommendations/{mine['id']}/review", json={"decision": "APPROVED"}).status_code == 403)
check("13 Reviewer dapat menyetujui", reviewer.post(f"/recommendations/{mine['id']}/review", json={"decision": "APPROVED"}).status_code == 200)

print("14. Kunci API tidak pernah di browser")
built = [p for p in glob.glob(str(ROOT / "apps/web/.next/static/**/*"), recursive=True) if p.endswith((".js", ".html", ".css"))]
leak = [p for p in built if re.search(r"LLM_API_KEY|sk-ant-|x-api-key", Path(p).read_text(errors="ignore"))]
envpub = (ROOT / "apps/web/.env.example").read_text() + (ROOT / "apps/web/.env.local").read_text()
check("bundel web tidak memuat kunci/nama variabel LLM", built and not leak, f"{len(built)} file diperiksa" if built else "jalankan `npm run build` dulu")
check("tidak ada NEXT_PUBLIC_*KEY/SECRET di env web", not re.search(r"NEXT_PUBLIC_\w*(KEY|SECRET|TOKEN)", envpub))
check("respons API tidak membocorkan konfigurasi LLM", "api_key" not in viewer.get("/auth/me").text.lower())

print("15. Audit log untuk tindakan penting")
acts = {x["action"] for x in admin.get("/audit-logs?limit=500").json()}
need = {"auth.login", "import.csv", "risk.run", "warning.update", "llm.recommendation", "llm.root_cause", "llm.review"}
check("login, import, hitung risiko, peringatan, generate AI, review tercatat", need <= acts, f"kurang: {sorted(need - acts)}" if need - acts else "")
check("Viewer tidak boleh membaca audit log", viewer.get("/audit-logs").status_code == 403)

print("16. Alur demo end-to-end berjalan")
check("skrip ini sendiri menjalankan: login 4 role → import → risiko → peringatan → AI → review", all(ok for _, ok, _ in results))

failed = [n for n, ok, _ in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} pemeriksaan lolos" + (f"; GAGAL: {failed}" if failed else ""))
sys.exit(1 if failed else 0)
