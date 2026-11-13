import { StatCard, toneOf } from "@/components/ui/StatCard";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Download, Landmark, MapPin, Plus, ShieldCheck, Shapes, FlaskConical } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card } from "@/components/ui/Card";
import { MapCard } from "@/features/map/MapCard";
import { CategorySpread, Composition, EarlyWarning, TopProvinces } from "@/features/overview/panels";
import { DataQuality, GroupTable, ObjectsTable, TABS, TabNav, type RepoRow, type TabId } from "@/features/cultural-repository/RepoViews";
import { FilterBar } from "@/features/overview/FilterBar";
import { API } from "@/lib/api-client";
import { api, getMe } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { CulturalObject, MapLevel, Overview, ProvinceSummary, Region, RiskLevelName } from "@/types/api";

const LEVELS: [RiskLevelName, string][] = [["HIGH", "Tinggi"], ["MEDIUM", "Sedang"], ["LOW", "Rendah"], ["INSUFFICIENT_DATA", "Data Kurang"]];
const SIZE = 10;

async function Content({ searchParams }: { searchParams: PageProps<"/cultural-repository">["searchParams"] }) {
  const [objects, regions, provinces, d, me, sp] = await Promise.all([
    api<CulturalObject[]>("/cultural-objects?limit=200"), api<Region[]>("/regions"), api<ProvinceSummary[]>("/map/provinces"), api<Overview>("/dashboard/overview"), getMe(), searchParams,
  ]);
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const f = { cat: one("cat"), prov: one("prov"), lvl: one("lvl") };
  const regionName = new Map(regions.map((r) => [r.id, r.name]));
  const risk = new Map<string, { score: number | null; level: RiskLevelName; confidence: number | null; pcode: string }>();
  provinces.forEach((p) => p.objects.forEach((o) => risk.set(o.id, { score: o.score, level: o.level, confidence: o.confidence, pcode: p.code })));
  const all: (RepoRow & { pcode: string })[] = objects.map((o) => ({ ...o, province: o.region_id ? regionName.get(o.region_id) ?? "—" : "—", ...(risk.get(o.id) ?? { score: null, level: "INSUFFICIENT_DATA" as RiskLevelName, confidence: null, pcode: "" }) }));
  const rows = all.filter((o) => (!f.cat || o.category === f.cat) && (!f.prov || o.pcode === f.prov) && (!f.lvl || o.level === f.lvl));
  const pages = Math.max(1, Math.ceil(rows.length / SIZE));
  const page = Math.min(Math.max(parseInt(one("page")) || 1, 1), pages);
  const tab: TabId = TABS.find(([t]) => t === one("tab"))?.[0] ?? "daftar";
  const href = (o: Record<string, string>) => `/cultural-repository?${new URLSearchParams({ ...Object.fromEntries(Object.entries({ ...f, tab: tab === "daftar" ? "" : tab, ...o }).filter(([, v]) => v)) })}#tabel`;
  const kpis = [
    { label: "Total Objek", value: rows.length, icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Jenis Budaya", value: new Set(rows.map((r) => r.category)).size, icon: Shapes, cls: "text-purple-700 bg-purple-50" },
    { label: "Provinsi Tercakup", value: new Set(rows.map((r) => r.province).filter((p) => p !== "—")).size, icon: MapPin, cls: "text-risk-low bg-green-50" },
    { label: "Terverifikasi", value: rows.filter((r) => r.verification_status === "VERIFIED").length, icon: ShieldCheck, cls: "text-risk-mid bg-amber-50" },
    { label: "Data SIMULATED", value: rows.filter((r) => r.data_origin === "SIMULATED").length, icon: FlaskConical, cls: "text-slate-600 bg-slate-100" },
  ];
  const categories = [...new Set(all.map((r) => r.category))].sort().map((c) => [c, c] as [string, string]);
  const provOpts = provinces.filter((p) => p.n_objects > 0).map((p) => [p.code, p.name] as [string, string]);

  return (
    <div className="space-y-4">
      <FilterBar action="/cultural-repository" categories={categories} provinces={provOpts} levels={LEVELS} values={f} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(({ label, value, icon, cls }) => <StatCard key={label} icon={icon} tone={toneOf(cls)} label={label} value={value} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card title="Peta Sebaran Objek Budaya" className="xl:col-span-2">
          <MapCard provinces={provinces} selected={f.prov || null} level={(f.lvl as MapLevel) || "ALL"} height={420} />
        </Card>
        <div className="grid gap-4 [&>*]:min-w-0">
          <Composition d={d} />
          <EarlyWarning d={d} />
        </div>
        <div className="xl:col-span-1"><CategorySpread provinces={provinces} /></div>
        <div className="xl:col-span-2"><TopProvinces provinces={provinces} /></div>
      </div>

      <div id="tabel" className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="border-b-2 border-navy pb-1 text-base font-bold text-navy">Direktori Objek Budaya</h2>
        <div className="flex gap-2">
          <a href={`${API}/reports/objects.csv`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50"><Download size={14} aria-hidden />Ekspor</a>
          {can(me.role, "analyze") && <Link href="/cultural-repository/new" className="inline-flex items-center gap-1.5 btn-gold px-3 py-1.5 text-sm font-semibold text-navy"><Plus size={14} aria-hidden />Tambah Objek</Link>}
        </div>
      </div>

      <TabNav active={tab} href={(t) => href({ tab: t === "daftar" ? "" : t, page: "" })} />
      {tab === "daftar" && <ObjectsTable rows={rows.slice((page - 1) * SIZE, page * SIZE)} />}
      {tab === "jenis" && <GroupTable rows={rows} by={(r) => r.category} label="Jenis Budaya" />}
      {tab === "provinsi" && <GroupTable rows={rows} by={(r) => r.province} label="Provinsi" />}
      {tab === "kualitas" && <DataQuality rows={rows} />}

      {tab === "daftar" && (
        <nav aria-label="Halaman" className="flex items-center justify-between text-sm text-slate-600">
          <span>Halaman {page} dari {pages} · {rows.length} objek</span>
          <span className="flex gap-1">
            {page > 1 && <Link href={href({ page: String(page - 1) })} aria-label="Sebelumnya" className="rounded-md bg-white p-1.5 ring-1 ring-slate-200 hover:bg-slate-50"><ChevronLeft size={16} /></Link>}
            {page < pages && <Link href={href({ page: String(page + 1) })} aria-label="Berikutnya" className="rounded-md bg-white p-1.5 ring-1 ring-slate-200 hover:bg-slate-50"><ChevronRight size={16} /></Link>}
          </span>
        </nav>
      )}
    </div>
  );
}

export default function CulturalRepositoryPage(props: PageProps<"/cultural-repository">) {
  return (
    <Suspense fallback={<PageLoader label="Memuat repositori…" />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
