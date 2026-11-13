import Link from "next/link";
import { ArrowUp, BadgeCheck, CheckCircle2, Layers, MapPin, Sparkles, Target, TriangleAlert, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import type { Analysis, Overview, ProvinceSummary, Recommendation, RiskLevelName } from "@/types/api";
import { SIM } from "./simulated";

const id = (n: number, d = 0) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const COLOR: Record<RiskLevelName, string> = { HIGH: "#d64545", MEDIUM: "#e8a317", LOW: "#2e9e5b", INSUFFICIENT_DATA: "#8a94a6" };
const PILL: Record<RiskLevelName, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" };

// Donut CSS murni (tanpa library chart): segmen = conic-gradient, angka di tengah.
export function Donut({ segs, center, sub }: { segs: { value: number; color: string }[]; center: string; sub: string }) {
  const total = segs.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const stops = total === 0 ? "#e2e8f0 0 100%" : segs.map((s) => `${s.color} ${(acc / total) * 100}% ${((acc += s.value) / total) * 100}%`).join(",");
  return (
    <div className="relative size-32 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={`${center} ${sub}`}>
      <div className="absolute inset-[17%] grid place-content-center rounded-full bg-white text-center">
        <b className="text-xl leading-none">{center}</b>
        <span className="text-[11px] text-slate-500">{sub}</span>
      </div>
    </div>
  );
}

function Delta({ v, unit = "%", worse = false }: { v: number; unit?: string; worse?: boolean }) {
  const good = (v >= 0) !== worse;
  return <span className={`text-xs font-semibold ${v === 0 ? "text-slate-500" : good ? "text-risk-low" : "text-risk-high"}`}>{v > 0 ? "▲ +" : v < 0 ? "▼ " : "● "}{id(v, 1)}{unit}</span>;
}

type Kpi = { label: string; value: string; icon: LucideIcon; tone: string; sim?: boolean; foot: React.ReactNode };

export function KpiStrip({ d }: { d: Overview }) {
  const k = SIM.kpis;
  const items: Kpi[] = [
    { label: "Total Objek Budaya", value: id(d.total_objects), icon: Layers, tone: "text-navy-2 bg-blue-50", foot: <span className="text-xs text-slate-500">{d.assessed_objects} dinilai</span> },
    { label: "Pelaku Budaya", value: id(k.pelaku.value), icon: BadgeCheck, tone: "text-purple-700 bg-purple-50", sim: true, foot: <Delta v={k.pelaku.delta} /> },
    { label: "Komunitas Aktif", value: id(k.komunitas.value), icon: MapPin, tone: "text-risk-low bg-green-50", sim: true, foot: <Delta v={k.komunitas.delta} /> },
    { label: "Program Pelestarian", value: id(k.program.value), icon: Layers, tone: "text-risk-mid bg-amber-50", sim: true, foot: <Delta v={k.program.delta} /> },
    { label: "Indeks Keberlangsungan", value: id(k.indeks.value, 1), icon: TriangleAlert, tone: "text-risk-high bg-red-50", sim: true, foot: <Delta v={k.indeks.delta} unit=" pt" /> },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon, tone, sim, foot }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <span className={`grid size-12 shrink-0 place-content-center rounded-2xl ${tone}`}><Icon size={22} aria-hidden /></span>
          <div className="min-w-0">
            <p className="cap truncate text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold leading-tight">{value}{label === "Indeks Keberlangsungan" && <span className="text-xs font-normal text-slate-500"> /100</span>}</p>
            <div className="flex items-center gap-1.5">{foot}{sim && <span className="rounded bg-gold-soft px-1 text-[9px] font-bold text-amber-800" title="Data contoh">SIM</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Composition({ d }: { d: Overview }) {
  const rows = (["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"] as const).map((k) => ({ k, label: { HIGH: "Risiko Tinggi", MEDIUM: "Risiko Sedang", LOW: "Risiko Rendah", INSUFFICIENT_DATA: "Data Kurang" }[k], v: d.distribution[k] }));
  return (
    <Card title="Komposisi Tingkat Risiko" className="h-full" bodyClassName="flex flex-col items-center justify-center gap-4">
      <Donut segs={rows.map((r) => ({ value: r.v, color: COLOR[r.k] }))} center={id(d.total_objects)} sub="Objek" />
      <ul className="w-full space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: COLOR[r.k] }} aria-hidden />
            <span className="flex-1">{r.label}</span>
            <b>{r.v}</b>
            <span className="w-12 text-right text-xs text-slate-500">({d.total_objects ? id((r.v / d.total_objects) * 100, 1) : "0"}%)</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function EarlyWarning({ d }: { d: Overview }) {
  const rows: [keyof Overview["open_warnings"], string, string, LucideIcon][] = [
    ["HIGH", "Peringatan tingkat tinggi", "bg-red-50 text-risk-high", ArrowUp],
    ["MEDIUM", "Perubahan tajam perlu diperiksa", "bg-amber-50 text-risk-mid", TriangleAlert],
    ["LOW", "Perlu verifikasi data", "bg-blue-50 text-blue-600", MapPin],
  ];
  return (
    <Card title="Early Warning Terbuka" className="h-full" bodyClassName="flex flex-col justify-center gap-2.5" action={<Link href="/cultural-risk-assessment/early-warnings" className="text-xs underline">Lihat Semua</Link>}>
      {rows.map(([k, text, tone, Icon]) => (
        <div key={k} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <span className={`grid size-10 place-content-center rounded-lg ${tone}`}><Icon size={18} aria-hidden /></span>
          <b className="w-8 text-2xl">{d.open_warnings[k]}</b>
          <span className="text-sm leading-snug">{text}</span>
        </div>
      ))}
    </Card>
  );
}

export function CategorySpread({ provinces }: { provinces: ProvinceSummary[] }) {
  const counts = new Map<string, number>();
  provinces.forEach((p) => p.objects.forEach((o) => counts.set(o.category, (counts.get(o.category) ?? 0) + 1)));
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, r) => a + r[1], 0);
  return (
    <Card title="Sebaran Objek per Jenis Budaya" className="h-full" bodyClassName="flex flex-col justify-center">
      {rows.length === 0 ? <p className="text-sm text-slate-600">Belum ada objek.</p> : (
        <ul className="space-y-2.5">
          {rows.map(([name, n]) => (
            <li key={name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-2 text-sm">
              <span className="raw truncate" title={name}>{name}</span>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-navy-2" style={{ width: `${(n / rows[0][1]) * 100}%` }} /></div>
              <span className="text-xs"><b>{n}</b> <span className="text-slate-500">({id((n / total) * 100, 0)}%)</span></span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function TopProvinces({ provinces }: { provinces: ProvinceSummary[] }) {
  const top = provinces.filter((p) => p.avg_score !== null).sort((a, b) => b.avg_score! - a.avg_score!).slice(0, 5);
  return (
    <Card title="Top 5 Provinsi dengan Risiko Tertinggi" className="h-full" action={<Link href="/risk-mapping-gis" className="text-xs underline">Peta Penuh</Link>}>
      {top.length === 0 ? <p className="text-sm text-slate-600">Belum ada provinsi yang dinilai.</p> : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="w-8 py-1">No</th><th>Provinsi</th><th>Objek</th><th className="text-right">Skor Risiko</th></tr></thead>
          <tbody>
            {top.map((p, i) => (
              <tr key={p.code} className="border-t border-slate-100">
                <td className="py-2.5"><span className={`grid size-6 place-content-center rounded-md text-xs font-bold ${i === 0 ? "bg-red-50 text-risk-high" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span></td>
                <td className="raw"><Link href={`/risk-mapping-gis?p=${p.code}`} className="font-medium text-navy-2 hover:underline">{p.name}</Link></td>
                <td>{p.n_objects}</td>
                <td className="text-right"><span className={`inline-block min-w-10 rounded-md px-2 py-1 text-center text-xs font-bold text-white ${PILL[p.level as RiskLevelName] ?? "bg-risk-none"}`}>{p.avg_score!.toFixed(0)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function ProgramStatus() {
  const s = SIM.programStatus;
  const total = s.reduce((a, r) => a + r.value, 0);
  return (
    <Card title="Status Program Pelestarian" className="h-full" action={<SimulatedBadge />} bodyClassName="flex flex-wrap items-center justify-center gap-4">
      <Donut segs={s} center={String(total)} sub="Program" />
      <ul className="space-y-1.5 text-sm">
        {s.map((r) => (
          <li key={r.label} className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: r.color }} aria-hidden />{r.label}<b className="ml-auto pl-3">{r.value}</b><span className="text-xs text-slate-500">({id((r.value / total) * 100, 0)}%)</span></li>
        ))}
      </ul>
    </Card>
  );
}

export function ProgramImpact() {
  return (
    <Card title="Dampak Program (Sebelum vs Sesudah)" className="h-full" action={<SimulatedBadge />} bodyClassName="flex flex-col justify-center gap-4">
      {SIM.impact.map((r) => (
        <div key={r.label} className="text-sm">
          <div className="flex items-center justify-between"><span className="font-medium">{r.label}</span><Delta v={((r.after - r.before) / r.before) * 100} /></div>
          {([["Sebelum", r.before, "bg-slate-300"], ["Sesudah", r.after, "bg-navy-2"]] as const).map(([l, v, c]) => (
            <div key={l} className="mt-1 grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 text-xs text-slate-500">
              {l}<div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${c}`} style={{ width: `${(v / Math.max(r.before, r.after)) * 100}%` }} /></div><b className="text-right text-navy">{id(v)}</b>
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

const REVIEW = { APPROVED: "Disetujui reviewer", REJECTED: "Ditolak reviewer", DRAFT: "Draft, belum ditinjau" } as const;

// Insight = ringkasan analisis AI tersimpan untuk objek prioritas #1; rekomendasi = daftar /recommendations. Keduanya data nyata.
export function InsightBand({ top, insight, recs }: { top: Overview["priority"][number] | undefined; insight: Analysis | null; recs: Recommendation[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Insight & Rekomendasi AI" icon={Sparkles}>
        {!insight || !top ? <p className="text-sm text-slate-600">Belum ada analisis AI. Buat dari halaman detail objek.</p> : (
          <div className="space-y-2 text-sm">
            <p className="text-xs text-slate-500">Objek prioritas: <Link href={`/cultural-objects/${top.id}`} className="raw font-semibold text-navy-2 hover:underline">{top.name}</Link> <RiskBadge level={top.level} /></p>
            <p className="text-slate-700">{insight.output.summary}</p>
            <p className="text-xs text-slate-500">{REVIEW[insight.review_status]} · penjelasan AI bukan fakta final, butuh validasi ahli</p>
          </div>
        )}
      </Card>
      <Card title="Rekomendasi Strategis" icon={Target} action={<Link href="/recommendations" className="text-xs underline">Lihat Semua</Link>}>
        {recs.length === 0 ? <p className="text-sm text-slate-600">Belum ada rekomendasi. Buat dari panel AI di detail objek.</p> : (
          <ul className="space-y-2 text-sm">
            {recs.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-risk-low" aria-hidden /><span className="raw">{r.title} <span className="text-xs text-slate-500">· {r.object_name}</span></span></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
