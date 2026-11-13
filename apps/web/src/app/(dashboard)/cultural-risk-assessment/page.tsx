import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, AlertTriangle, Gauge, Landmark, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MapCard } from "@/features/map/MapCard";
import { FilterBar } from "@/features/overview/FilterBar";
import { ObjectDetail } from "@/features/overview/ObjectDetail";
import { ObjectTable, PAGE_SIZE, type Row } from "@/features/overview/ObjectTable";
import { RiskChart } from "@/features/overview/RiskChart";
import { TrendChart } from "@/features/overview/TrendChart";
import { API } from "@/lib/api-client";
import { api, getMe } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { MapLevel, Overview, ProvinceSummary, RiskLevelName } from "@/types/api";

const LEVELS: [RiskLevelName, string][] = [["HIGH", "Tinggi"], ["MEDIUM", "Sedang"], ["LOW", "Rendah"], ["INSUFFICIENT_DATA", "Data Kurang"]];

async function Content({ searchParams }: { searchParams: PageProps<"/cultural-risk-assessment">["searchParams"] }) {
  const [d, provinces, me, sp] = await Promise.all([api<Overview>("/dashboard/overview"), api<ProvinceSummary[]>("/map/provinces"), getMe(), searchParams]);
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const f = { cat: one("cat"), prov: one("prov") || one("p"), lvl: one("lvl") };
  const all: (Row & { pcode: string })[] = provinces.flatMap((p) => p.objects.map((o) => ({ id: o.id, name: o.name, category: o.category, province: p.name, pcode: p.code, score: o.score, level: o.level, is_simulated: o.is_simulated })));
  const scoped = all.filter((r) => (!f.cat || r.category === f.cat) && (!f.prov || r.pcode === f.prov));
  const rows = scoped.filter((r) => !f.lvl || r.level === f.lvl).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const dist = Object.fromEntries(LEVELS.map(([l]) => [l, rows.filter((r) => r.level === l).length])) as Record<RiskLevelName, number>;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(one("page")) || 1, 1), pages);
  const selected = rows.find((r) => r.id === one("obj")) ?? rows[0] ?? null;
  const href = (o: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries({ ...f, ...(one("page") && { page: one("page") }), ...(one("obj") && { obj: one("obj") }), ...o }).filter(([, v]) => v !== "").map(([k, v]) => [k, String(v)]));
    return `/cultural-risk-assessment?${q}#objek`;
  };
  const scores = rows.flatMap((r) => (r.score === null ? [] : [r.score]));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const kpis = [
    { label: "Total Objek Budaya", value: rows.length.toLocaleString("id-ID"), icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Risiko Tinggi", value: dist.HIGH, icon: AlertTriangle, cls: "text-risk-high bg-red-50" },
    { label: "Risiko Sedang", value: dist.MEDIUM, icon: AlertCircle, cls: "text-risk-mid bg-amber-50" },
    { label: "Risiko Rendah", value: dist.LOW, icon: ShieldCheck, cls: "text-risk-low bg-green-50" },
    { label: "Skor Rata-rata", value: avg ?? "—", icon: Gauge, cls: "text-purple-700 bg-purple-50" },
  ];
  const categories = [...new Set(all.map((r) => r.category))].sort().map((c) => [c, c] as [string, string]);
  const provOpts = provinces.filter((p) => p.n_objects > 0).map((p) => [p.code, p.name] as [string, string]);

  return (
    <div className="space-y-4">
      <FilterBar action="/cultural-risk-assessment" categories={categories} provinces={provOpts} levels={LEVELS} values={f} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <span className={`rounded-2xl p-3 ${cls}`}><Icon size={24} aria-hidden /></span>
            <div><p className="cap text-xs text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>*]:min-w-0">
        <Card title="Peta Sebaran Risiko Budaya" className="md:col-span-2">
          <MapCard provinces={provinces} selected={f.prov || null} level={(f.lvl as MapLevel) || "ALL"} />
        </Card>
        <div className="grid gap-4 md:grid-rows-2 [&>*]:min-w-0 [&>*]:overflow-hidden">
          <Card title="Tren Tingkat Risiko (Nasional)">
            {d.trend.length >= 2 ? <TrendChart trend={d.trend} /> : <p className="text-sm text-slate-600">Tren butuh minimal dua periode penilaian.</p>}
          </Card>
          <Card title="Distribusi Risiko" bodyClassName="flex items-center justify-center"><RiskChart distribution={dist} total={rows.length} /></Card>
        </div>
        <div className="xl:row-span-2">
          {selected
            ? <Suspense fallback={<p className="text-sm text-slate-500">Memuat detail…</p>}><ObjectDetail id={selected.id} province={selected.province} /></Suspense>
            : <Card title="Detail Penilaian Risiko"><p className="text-sm text-slate-600">Tidak ada objek untuk ditampilkan.</p></Card>}
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <ObjectTable rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} total={rows.length} page={page} selected={selected?.id ?? null} href={href}
            csvHref={`${API}/reports/objects.csv`} canAdd={can(me.role, "analyze")} />
        </div>
      </div>
      <p className="text-xs text-slate-500">Data SIMULATED ditandai pada tabel. <Link href="/" className="underline">Kembali ke Beranda</Link></p>
    </div>
  );
}

export default function CulturalRiskAssessmentPage(props: PageProps<"/cultural-risk-assessment">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Memuat peta…</p>}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
