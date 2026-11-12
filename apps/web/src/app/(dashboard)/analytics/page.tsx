import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-server";
import type { PredictionStatus } from "@/types/api";

async function Content() {
  const s = await api<PredictionStatus>("/analytics/prediction/status");
  return (
    <div className="space-y-4">
      <div role="status" className={`rounded-2xl p-4 ring-1 ${s.passed ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-200"}`}>
        <p className="font-semibold">{s.passed ? "Prediksi memenuhi gerbang validasi" : "Prediksi belum ditampilkan"}</p>
        <p className="mt-1 text-sm text-slate-700">
          {s.passed ? "Semua syarat terpenuhi." : "Data historis belum memenuhi syarat validasi. Yang tersedia saat ini hanya tren deskriptif dan skor baseline (lihat Overview dan detail objek). NCRI tidak menampilkan angka prediksi yang belum teruji."}
        </p>
      </div>

      <Card title="Kesiapan Data untuk Prediksi" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Syarat</th><th>Saat ini</th><th>Dibutuhkan</th><th>Status</th></tr>
          </thead>
          <tbody>
            {s.requirements.map((r) => (
              <tr key={r.label} className="border-t border-slate-100">
                <td className="py-2">{r.label}</td><td className="font-semibold">{r.current}</td><td>{r.needed}</td>
                <td>{r.met ? <span className="font-semibold text-risk-low">✓ Terpenuhi</span> : <span className="font-semibold text-risk-high">✗ Belum</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">Ambang adalah usulan awal untuk dibahas dengan ahli statistik, bukan standar baku.</p>
      </Card>

      <Card title="Definisi & Metode (provisional)">
        <dl className="space-y-2 text-sm">
          <div><dt className="font-semibold">Target</dt><dd className="text-slate-700">{s.target}</dd></div>
          <div><dt className="font-semibold">Baseline yang harus dikalahkan</dt><dd className="text-slate-700">{s.baseline}. Model baru dianggap layak bila Brier score lebih baik ≥ {s.thresholds.min_improvement_over_baseline} dari baseline pada data uji yang dipisah menurut waktu.</dd></div>
          <div><dt className="font-semibold">Evaluasi</dt><dd className="text-slate-700">Latih pada periode lampau, uji pada periode terbaru (tanpa kebocoran waktu); laporkan Brier, AUC, MAE, dan kalibrasi. Dokumentasi bias dan batasan: <code>docs/model-card.md</code>.</dd></div>
        </dl>
      </Card>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}><Content /></Suspense>
    </div>
  );
}
