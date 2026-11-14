import { StatCard, toneOf } from "@/components/ui/StatCard";
import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { Suspense } from "react";
import { AlertTriangle, AlertCircle, Gauge, Landmark, ShieldCheck, Database } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ObjectThumb } from "@/features/ai-predictive-risk-engine/ObjectThumb";
import { MapCard } from "@/features/map/MapCard";
import { Focus } from "@/features/ai-predictive-risk-engine/Focus";
import { api } from "@/lib/api-server";
import type { Overview, PredictionStatus, ProvinceSummary } from "@/types/api";

const PILL = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" } as const;

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
  const kpis = [
    { label: "Objek Budaya Terpantau", value: d.total_objects.toLocaleString("id-ID"), icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Risiko Tinggi (Baseline)", value: d.distribution.HIGH, icon: AlertTriangle, cls: "text-risk-high bg-red-50" },
    { label: "Risiko Sedang (Baseline)", value: d.distribution.MEDIUM, icon: AlertCircle, cls: "text-risk-mid bg-amber-50" },
    { label: "Risiko Rendah (Baseline)", value: d.distribution.LOW, icon: ShieldCheck, cls: "text-risk-low bg-green-50" },
    { label: "Akurasi Model", value: "Lulus", empty: !s.passed ? "Belum Ada" : undefined, icon: Gauge, cls: "text-purple-700 bg-purple-50" },
    { label: "Objek Dinilai", value: d.assessed_objects.toLocaleString("id-ID"), icon: Database, cls: "text-navy-2 bg-blue-50" },
  ];

  return (
    <div className="space-y-4">
      <div role="status" className={`rounded-2xl p-3 text-sm ring-1 ${s.passed ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-200"}`}>
        <p className="font-semibold">{s.passed ? "Prediksi memenuhi gerbang validasi" : "Model prediksi belum divalidasi"}</p>
        <p className="mt-0.5 text-slate-700">{s.passed ? "Semua syarat terpenuhi." : "Skor saat ini = baseline nyata. Probabilitas dan proyeksi belum ditampilkan sampai model lulus validasi."}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon, cls, empty }) => <StatCard key={label} icon={icon} tone={toneOf(cls)} label={label} value={value} emptyNote={empty} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-4 [&>*]:min-w-0">
        <Card title="Peta Risiko Saat Ini (Baseline)" className="xl:col-span-3"><MapCard provinces={provinces} selected={prov || null} level="ALL" /></Card>
        {selected
          ? <Suspense fallback={<PageLoader label="Memuat detail…" />}><Focus id={selected.id} province={selected.province} /></Suspense>
          : <Card title="Detail Objek"><p className="text-sm text-slate-600">Belum ada objek yang dinilai.</p></Card>}
      </div>

      <div className="[&>*]:min-w-0">
        <Card title="Daftar Objek Skor Tertinggi" action={<Link href="/cultural-risk-assessment" className="cap text-xs font-semibold hover:underline">Lihat Semua →</Link>} className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="py-2 pr-4">Peringkat</th><th className="pr-4">Objek Budaya</th><th className="pr-4">Provinsi</th><th className="text-center">Skor Saat Ini</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {top.map((r, i) => {
                const sc = r.score ?? 0;
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-lg font-bold text-navy">{i + 1}</span></td>
                    <td className="pr-4"><div className="flex items-center gap-3"><ObjectThumb name={r.name} size={44} /><span className="raw font-bold text-navy">{r.name}</span></div></td>
                    <td className="raw pr-4">{r.province}</td>
                    <td className="text-center"><span className={`inline-block min-w-11 rounded-md px-2.5 py-1 font-bold text-white ${PILL[r.level]}`}>{sc.toFixed(0)}</span></td>
                    <td className="text-center"><Link href={`/ai-predictive-risk-engine/${r.id}`} className="cap btn-gold px-3 py-1.5 text-xs font-semibold text-navy shadow-sm">Detail</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Skor saat ini = baseline nyata (merah = tinggi). Foto: Wikipedia, tanpa foto = ikon.</p>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] [&>*]:min-w-0">
      <Card title="Kesiapan Data untuk Prediksi" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
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
        <dl className="space-y-4 text-sm">
          <div><dt className="cap text-xs font-semibold text-slate-500">Target</dt><dd className="text-slate-700">{s.target}</dd></div>
          <div><dt className="cap text-xs font-semibold text-slate-500">Baseline yang harus dikalahkan</dt><dd className="text-slate-700">{s.baseline}. Model baru dianggap layak bila Brier score lebih baik ≥ {s.thresholds.min_improvement_over_baseline} dari baseline pada data uji yang dipisah menurut waktu.</dd></div>
          <div><dt className="cap text-xs font-semibold text-slate-500">Evaluasi</dt><dd className="text-slate-700">Latih pada periode lampau, uji pada periode terbaru (tanpa kebocoran waktu); laporkan Brier, AUC, MAE, dan kalibrasi. Dokumentasi bias dan batasan: <code>docs/model-card.md</code>.</dd></div>
        </dl>
      </Card>
      </div>
    </div>
  );
}

export default function AiPredictiveRiskEnginePage(props: PageProps<"/ai-predictive-risk-engine">) {
  return (
    <Suspense fallback={<PageLoader label="Memuat…" />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
