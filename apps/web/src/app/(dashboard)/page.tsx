import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, AlertCircle, Gauge, Landmark, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { OverviewMap } from "@/features/map/OverviewMap";
import { RiskChart } from "@/features/overview/RiskChart";
import { RunRiskButton } from "@/features/overview/RunRiskButton";
import { TrendChart } from "@/features/overview/TrendChart";
import { api } from "@/lib/api-server";
import type { Overview as OverviewData, ProvinceSummary } from "@/types/api";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

async function Content() {
  const [d, provinces] = await Promise.all([api<OverviewData>("/dashboard/overview"), api<ProvinceSummary[]>("/map/provinces")]);
  const [prev, last] = d.trend.length >= 2 ? [d.trend[d.trend.length - 2], d.trend[d.trend.length - 1]] : [null, null];
  const delta = (k: "HIGH" | "MEDIUM" | "LOW") => (prev && last ? { n: last[k] - prev[k], vs: prev.period_end.slice(0, 4), worse: k === "HIGH" } : null);
  const kpis = [
    { label: "Total Objek Budaya", value: d.total_objects.toLocaleString("id-ID"), icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Risiko Tinggi", value: d.distribution.HIGH, icon: AlertTriangle, cls: "text-risk-high bg-red-50", delta: delta("HIGH") },
    { label: "Risiko Sedang", value: d.distribution.MEDIUM, icon: AlertCircle, cls: "text-risk-mid bg-amber-50", delta: delta("MEDIUM") },
    { label: "Risiko Rendah", value: d.distribution.LOW, icon: ShieldCheck, cls: "text-risk-low bg-green-50", delta: delta("LOW") },
    { label: "Data Confidence Rata-rata", value: d.avg_confidence?.toFixed(2).replace(".", ",") ?? "—", icon: Gauge, cls: "text-purple-700 bg-purple-50" },
  ];
  const quality = [
    ["Kelengkapan indikator", d.quality.completeness],
    ["Kemutakhiran data", d.quality.freshness],
    ["Terverifikasi", d.quality.verification],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {d.is_simulated && <SimulatedBadge />}
        <span className="text-sm text-slate-500">
          {d.assessed_objects} dari {d.total_objects} objek memiliki data cukup untuk dinilai
        </span>
        <span className="w-full text-xs text-slate-500">
          Sumber: {d.sources.join(", ") || "—"} · penilaian s.d. {d.latest_period_end ?? "—"} · metode {d.method_version}
        </span>
        <span className="ml-auto"><RunRiskButton /></span>
      </div>

      <nav aria-label="Bagian halaman" className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1.5 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        {[["#ringkasan", "Ringkasan"], ["#peta", "Peta Risiko"], ["#tren", "Tren & Peringatan"], ["#prioritas", "Fokus Prioritas"], ["#kualitas", "Kualitas Data"]].map(([h, l], i) => (
          <a key={h} href={h} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${i === 0 ? "bg-navy text-white" : "text-navy hover:bg-slate-100"}`}>{l}</a>
        ))}
      </nav>

      {d.assessed_objects === 0 && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          Belum ada penilaian risiko. Import observasi di <Link className="underline" href="/data-sources">Data Sources</Link>, lalu klik “Hitung ulang risiko”.
        </p>
      )}

      <div id="ringkasan" className="grid scroll-mt-16 grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, cls, delta: dl }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <span className={`rounded-full p-2.5 ${cls}`}><Icon size={22} aria-hidden /></span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
              {dl && (
                <p className={`text-xs font-semibold ${dl.n === 0 ? "text-slate-500" : dl.n > 0 === dl.worse ? "text-risk-high" : "text-risk-low"}`}>
                  {dl.n === 0 ? "● tetap" : dl.n > 0 ? `▲ +${dl.n}` : `▼ ${dl.n}`} <span className="font-normal text-slate-500">vs {dl.vs}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card id="peta" title="Peta Risiko Nasional" className="scroll-mt-16 lg:col-span-2" action={<Link href="/risk-map" className="text-xs underline">Buka peta penuh</Link>}>
          <OverviewMap provinces={provinces} />
        </Card>
        <Card title="Distribusi Risiko"><RiskChart distribution={d.distribution} total={d.total_objects} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card id="tren" title="Tren Tingkat Risiko per Periode" className="scroll-mt-16 lg:col-span-2">
          {d.trend.length >= 2
            ? <TrendChart trend={d.trend} />
            : <p className="text-sm text-slate-600">Tren butuh minimal dua periode penilaian.</p>}
        </Card>
        <Card title="Early Warning Terbuka" action={<Link href="/early-warnings" className="text-xs underline">Lihat semua</Link>}>
          <ul className="space-y-3">
            {([["HIGH", "Peringatan tingkat tinggi"], ["MEDIUM", "Perubahan tajam perlu diperiksa"], ["LOW", "Perlu verifikasi data"]] as const).map(([k, text]) => (
              <li key={k} className="flex items-center gap-3">
                <span className="w-12 text-right text-2xl font-bold">{d.open_warnings[k]}</span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card id="prioritas" title="Top Objek yang Perlu Ditinjau" className="scroll-mt-16 overflow-x-auto lg:col-span-2">
          {d.priority.length === 0 ? <p className="text-sm text-slate-600">Belum ada objek yang dinilai.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr><th className="py-2">Objek</th><th>Provinsi</th><th>Skor</th><th>Tingkat</th><th title="Data confidence, terpisah dari skor">Confidence</th></tr>
              </thead>
              <tbody>
                {d.priority.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-2.5 font-medium"><Link href={`/cultural-objects/${p.id}`} className="text-navy-2 hover:underline">{p.name}</Link></td>
                    <td>{p.province ?? "—"}</td>
                    <td className="font-semibold">{p.score.toFixed(0)}</td>
                    <td><RiskBadge level={p.level} /></td>
                    <td>{p.data_confidence.toFixed(2).replace(".", ",")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card id="kualitas" title="Kualitas & Kemutakhiran Data" className="scroll-mt-16">
          <ul className="space-y-3">
            {quality.map(([label, v]) => (
              <li key={label}>
                <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{pct(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round((v ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${(v ?? 0) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function Overview() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Memuat ringkasan…</p>}>
      <Content />
    </Suspense>
  );
}
