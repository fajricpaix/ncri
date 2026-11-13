import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { OverviewMap } from "@/features/map/OverviewMap";
import { CategorySpread, Composition, EarlyWarning, InsightBand, KpiStrip, ProgramImpact, ProgramStatus, TopProvinces } from "@/features/overview/panels";
import { RunRiskButton } from "@/features/overview/RunRiskButton";
import { TrendChart } from "@/features/overview/TrendChart";
import { api } from "@/lib/api-server";
import type { Analysis, Overview as OverviewData, ProvinceSummary, Recommendation } from "@/types/api";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const soft = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback); // insight/rekomendasi opsional: jangan jatuhkan halaman

async function Content() {
  const [d, provinces, recs] = await Promise.all([
    api<OverviewData>("/dashboard/overview"),
    api<ProvinceSummary[]>("/map/provinces"),
    soft(api<Recommendation[]>("/recommendations"), []),
  ]);
  const top = d.priority[0];
  const analyses = top ? await soft(api<Analysis[]>(`/cultural-objects/${top.id}/analyses`), []) : [];
  const insight = analyses.find((a) => a.analysis_type === "RISK_EXPLANATION") ?? analyses[0] ?? null;
  const quality = [
    ["Kelengkapan", d.quality.completeness],
    ["Kemutakhiran", d.quality.freshness],
    ["Terverifikasi", d.quality.verification],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {d.is_simulated && <SimulatedBadge />}
        <span className="text-sm text-slate-600">{d.assessed_objects} dari {d.total_objects} objek memiliki data cukup untuk dinilai</span>
        <span className="ml-auto"><RunRiskButton /></span>
        <p className="w-full text-xs text-slate-500">
          Sumber: {d.sources.join(", ") || "—"} · penilaian s.d. {d.latest_period_end ?? "—"} · metode {d.method_version} ·{" "}
          {quality.map(([l, v]) => `${l} ${pct(v)}`).join(" · ")} · Data confidence {d.avg_confidence?.toFixed(2).replace(".", ",") ?? "—"}
        </p>
      </div>

      {d.assessed_objects === 0 && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          Belum ada penilaian risiko. Import observasi di <Link className="underline" href="/data-sources">Data Submission</Link>, lalu klik “Hitung ulang risiko”.
        </p>
      )}

      <KpiStrip d={d} />

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1.7fr_1fr_1fr_1.1fr]">
        <Card title="Peta Risiko Nasional" className="lg:col-span-2 2xl:col-span-1" action={<Link href="/risk-mapping-gis" className="text-xs underline">Buka Peta Penuh</Link>}>
          <OverviewMap provinces={provinces} height={250} />
        </Card>
        <Composition d={d} />
        <Card title="Tren Tingkat Risiko per Periode" className="h-full" bodyClassName="flex items-center">
          {d.trend.length >= 2 ? <div className="w-full"><TrendChart trend={d.trend} /></div> : <p className="text-sm text-slate-600">Tren butuh minimal dua periode penilaian.</p>}
        </Card>
        <div className="lg:col-span-2 2xl:col-span-1"><EarlyWarning d={d} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <CategorySpread provinces={provinces} />
        <TopProvinces provinces={provinces} />
        <ProgramStatus />
        <ProgramImpact />
      </div>

      <InsightBand top={top} insight={insight} recs={recs} />
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
