import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, AlertCircle, Gauge, Landmark, ShieldCheck, Database } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { MapCard } from "@/features/map/MapCard";
import { Focus } from "@/features/ai-predictive-risk-engine/Focus";
import { Scenario } from "@/features/ai-predictive-risk-engine/Scenario";
import { projectScore, simProb } from "@/features/ai-predictive-risk-engine/sim";
import { api } from "@/lib/api-server";
import type { Overview, PredictionStatus, ProvinceSummary } from "@/types/api";

async function Content({ searchParams }: { searchParams: PageProps<"/ai-predictive-risk-engine">["searchParams"] }) {
  const [s, d, provinces, sp] = await Promise.all([api<PredictionStatus>("/analytics/prediction/status"), api<Overview>("/dashboard/overview"), api<ProvinceSummary[]>("/map/provinces"), searchParams]);
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const prov = one("prov");
  const rows = provinces
    .filter((p) => !prov || p.code === prov)
    .flatMap((p) => p.objects.map((o) => ({ ...o, province: p.name })))
    .filter((r) => r.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const selected = rows.find((r) => r.id === one("obj")) ?? rows[0] ?? null;
  const top = rows.slice(0, 5);
  const base2028 = selected ? projectScore(selected.score ?? 0)[3].mid : 0;
  const kpis = [
    { label: "Objek Budaya Terpantau", value: d.total_objects.toLocaleString("id-ID"), icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Risiko Tinggi (Baseline)", value: d.distribution.HIGH, icon: AlertTriangle, cls: "text-risk-high bg-red-50" },
    { label: "Risiko Sedang (Baseline)", value: d.distribution.MEDIUM, icon: AlertCircle, cls: "text-risk-mid bg-amber-50" },
    { label: "Risiko Rendah (Baseline)", value: d.distribution.LOW, icon: ShieldCheck, cls: "text-risk-low bg-green-50" },
    { label: "Akurasi Model", value: s.passed ? "Lulus" : "Belum Ada", icon: Gauge, cls: "text-purple-700 bg-purple-50" },
    { label: "Objek Dinilai", value: d.assessed_objects.toLocaleString("id-ID"), icon: Database, cls: "text-navy-2 bg-blue-50" },
  ];
  const q = (o: string) => `/ai-predictive-risk-engine?${new URLSearchParams({ ...(prov && { prov }), obj: o })}`;

  return (
    <div className="space-y-4">
      <div role="status" className={`rounded-2xl p-3 text-sm ring-1 ${s.passed ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-200"}`}>
        <p className="font-semibold">{s.passed ? "Prediksi memenuhi gerbang validasi" : "Model prediksi belum divalidasi"}</p>
        <p className="mt-0.5 text-slate-700">{s.passed ? "Semua syarat terpenuhi." : "Skor saat ini = baseline nyata. Probabilitas, proyeksi, dan simulasi di halaman ini berlabel SIMULATED: contoh tampilan, bukan hasil model."}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <span className={`rounded-2xl p-3 ${cls}`}><Icon size={22} aria-hidden /></span>
            <div><p className="cap text-xs text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] [&>*]:min-w-0">
        <Card title="Peta Risiko Saat Ini (Baseline)"><MapCard provinces={provinces} selected={prov || null} level="ALL" /></Card>
        {selected
          ? <Suspense fallback={<p className="text-sm text-slate-500">Memuat detail…</p>}><Focus id={selected.id} province={selected.province} /></Suspense>
          : <Card title="Detail Objek"><p className="text-sm text-slate-600">Belum ada objek yang dinilai.</p></Card>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr] [&>*]:min-w-0">
        {selected && <Scenario key={selected.id} base={base2028} />}
        <Card title="Daftar Objek Skor Tertinggi" action={<SimulatedBadge />} className="overflow-x-auto lg:col-span-2 xl:col-span-1">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="py-1.5">#</th><th>Objek</th><th>Skor</th><th>Prediksi 2028</th><th>Prob.</th><th /></tr></thead>
            <tbody>
              {top.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 font-bold">{i + 1}</td>
                  <td><span className="raw font-semibold">{r.name}</span><br /><span className="raw text-xs text-slate-500">{r.province}</span></td>
                  <td><RiskBadge level={r.level} /> {r.score?.toFixed(0)}</td>
                  <td className="text-slate-500">{projectScore(r.score ?? 0)[3].mid}</td>
                  <td className="text-slate-500">{simProb(r.score ?? 0)}%</td>
                  <td><Link href={q(r.id)} className="cap rounded-lg bg-gold-soft px-2.5 py-1 text-xs font-semibold text-navy hover:brightness-95">Detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Skor = baseline nyata. Kolom Prediksi 2028 dan Prob. = SIMULATED.</p>
        </Card>
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
        {s.excluded_simulated > 0 && (
          <p role="note" className="mt-3 rounded-lg bg-gold-soft p-2 text-xs font-semibold text-amber-900">
            {s.excluded_simulated} penilaian berbasis data SIMULATED tidak dihitung di sini. Data simulasi tidak boleh menjadi dasar kesiapan prediksi.
          </p>
        )}
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

export default function AiPredictiveRiskEnginePage(props: PageProps<"/ai-predictive-risk-engine">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
