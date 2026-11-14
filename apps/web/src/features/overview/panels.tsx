import Link from "next/link";
import { StatCard, toneOf } from "@/components/ui/StatCard";
import { ArrowRight, BadgeCheck, Bell, CheckCircle2, Layers, Sparkles, Target, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { Analysis, Overview, ProvinceSummary, Recommendation, RiskLevelName } from "@/types/api";

const id = (n: number, d = 0) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const COLOR: Record<RiskLevelName, string> = { HIGH: "#d64545", MEDIUM: "#e8a317", LOW: "#2e9e5b", INSUFFICIENT_DATA: "#8a94a6" };
const PILL: Record<RiskLevelName, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" };

// Donut CSS murni (tanpa library chart): segmen = conic-gradient, angka di tengah.
export function Donut({ segs, center, sub, size = "size-28" }: { segs: { value: number; color: string }[]; center: string; sub: string; size?: string }) {
  const total = segs.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const stops = total === 0 ? "#e2e8f0 0 100%" : segs.map((s) => `${s.color} ${(acc / total) * 100}% ${((acc += s.value) / total) * 100}%`).join(",");
  return (
    <div className={`relative ${size} shrink-0 rounded-full`} style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={`${center} ${sub}`}>
      <div className="absolute inset-[17%] grid place-content-center rounded-full bg-white text-center">
        <b className="text-xl leading-none">{center}</b>
        <span className="text-[11px] text-slate-500">{sub}</span>
      </div>
    </div>
  );
}

export function KpiStrip({ d }: { d: Overview }) {
  const w = d.open_warnings;
  const items = [
    { label: "Total Objek Budaya", value: id(d.total_objects), icon: Layers, tone: "text-navy-2 bg-blue-50", foot: `${d.assessed_objects} dinilai` },
    { label: "Objek Risiko Tinggi", value: id(d.distribution.HIGH), icon: TriangleAlert, tone: "text-risk-high bg-red-50", foot: `${id(d.distribution.MEDIUM)} risiko sedang` },
    { label: "Peringatan Terbuka", value: id(w.HIGH + w.MEDIUM + w.LOW), icon: Bell, tone: "text-risk-mid bg-amber-50", foot: `${id(w.HIGH)} prioritas tinggi` },
    { label: "Rata-rata Data Confidence", value: d.avg_confidence === null ? "—" : id(d.avg_confidence, 2), icon: BadgeCheck, tone: "text-risk-low bg-green-50", foot: "terpisah dari skor risiko" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon, tone, foot }) => (
        <StatCard key={label} icon={icon} tone={toneOf(tone)} label={label} value={value} foot={<span className="text-xs text-slate-500">{foot}</span>} />
      ))}
    </div>
  );
}

export function Composition({ d }: { d: Overview }) {
  const rows = (["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"] as const).map((k) => ({ k, label: { HIGH: "Risiko Tinggi", MEDIUM: "Risiko Sedang", LOW: "Risiko Rendah", INSUFFICIENT_DATA: "Data Kurang" }[k], v: d.distribution[k] }));
  return (
    <Card title="Komposisi Tingkat Risiko" className="h-full" bodyClassName="flex items-center gap-4 !p-3">
      <Donut segs={rows.map((r) => ({ value: r.v, color: COLOR[r.k] }))} center={id(d.total_objects)} sub="Objek" />
      <ul className="min-w-0 flex-1 space-y-1 text-[13px]">
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

const WARN: [keyof Overview["open_warnings"], string, string, string][] = [
  ["HIGH", "Peringatan tingkat tinggi", "#d64545", "bg-red-50 text-risk-high"],
  ["MEDIUM", "Perubahan tajam perlu diperiksa", "#e8a317", "bg-amber-50 text-amber-700"],
  ["LOW", "Perlu verifikasi data", "#3b82f6", "bg-blue-50 text-blue-600"],
];

// Total besar + bar proporsi bertumpuk, lalu rincian per tingkat (angka, porsi) dan satu tombol aksi.
export function EarlyWarning({ d }: { d: Overview }) {
  const total = WARN.reduce((a, [k]) => a + d.open_warnings[k], 0);
  return (
    <Card title="Early Warning Terbuka" icon={Bell} className="h-full" bodyClassName="flex flex-col gap-4">
      <div>
        <p className="flex items-baseline gap-2"><b className="text-4xl leading-none">{total}</b><span className="text-sm text-slate-500">peringatan terbuka</span></p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={WARN.map(([k, l]) => `${l}: ${d.open_warnings[k]}`).join(", ")}>
          {WARN.map(([k, , color]) => <span key={k} style={{ width: `${total ? (d.open_warnings[k] / total) * 100 : 0}%`, background: color }} />)}
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {WARN.map(([k, text, color, tone]) => (
          <li key={k} className="flex items-center gap-3 py-2.5">
            <span className={`grid h-8 min-w-11 place-content-center rounded-lg px-2 text-base font-bold ${tone}`}>{d.open_warnings[k]}</span>
            <span className="flex-1 text-sm leading-snug">{text}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="size-2 rounded-full" style={{ background: color }} aria-hidden />{total ? id((d.open_warnings[k] / total) * 100, 0) : 0}%</span>
          </li>
        ))}
      </ul>
      <Link href="/early-warnings" className="cap mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-navy hover:brightness-95">Tinjau Semua Peringatan <ArrowRight size={14} aria-hidden /></Link>
    </Card>
  );
}

export function CategorySpread({ provinces }: { provinces: ProvinceSummary[] }) {
  const counts = new Map<string, number>();
  provinces.forEach((p) => p.objects.forEach((o) => counts.set(o.category, (counts.get(o.category) ?? 0) + 1)));
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, r) => a + r[1], 0);
  return (
    <Card title="Sebaran Objek per Jenis Budaya" className="h-full" bodyClassName="flex flex-col">
      {rows.length === 0 ? <p className="text-sm text-slate-600">Belum ada objek.</p> : (
        <ul className="flex flex-1 flex-col justify-between gap-3">
          {rows.map(([name, n]) => (
            <li key={name} className="text-sm">
              <div className="flex items-baseline justify-between gap-2"><span className="raw truncate font-medium" title={name}>{name}</span><span className="shrink-0 text-xs"><b>{n}</b> <span className="text-slate-500">({id((n / total) * 100, 0)}%)</span></span></div>
              <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-navy-2" style={{ width: `${(n / rows[0][1]) * 100}%` }} /></div>
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

const REVIEW = { APPROVED: "Disetujui reviewer", REJECTED: "Ditolak reviewer", DRAFT: "Draft, belum ditinjau" } as const;

// Insight = ringkasan analisis AI tersimpan untuk objek prioritas #1; rekomendasi = daftar /recommendations. Keduanya data nyata.
export function InsightBand({ top, insight, recs }: { top: Overview["priority"][number] | undefined; insight: Analysis | null; recs: Recommendation[] }) {
  return (
    <>
      <Card title="Insight & Rekomendasi AI" icon={Sparkles} className="h-full md:col-span-2 xl:col-span-3">
        {!insight || !top ? <p className="text-sm text-slate-600">Belum ada analisis AI. Buat dari halaman detail objek.</p> : (
          <div className="space-y-2 text-sm">
            <p className="text-xs text-slate-500">Objek prioritas: <Link href={`/cultural-repository/${top.id}`} className="raw font-semibold text-navy-2 hover:underline">{top.name}</Link> <RiskBadge level={top.level} /></p>
            <p className="text-slate-700">{insight.output.summary}</p>
            <p className="text-xs text-slate-500">{REVIEW[insight.review_status]} · penjelasan AI bukan fakta final, butuh validasi ahli</p>
          </div>
        )}
      </Card>
      <Card title="Rekomendasi Strategis" icon={Target} className="h-full md:col-span-2 xl:col-span-3" action={<Link href="/recommendations" className="text-xs underline">Lihat Semua</Link>}>
        {recs.length === 0 ? <p className="text-sm text-slate-600">Belum ada rekomendasi. Buat dari panel AI di detail objek.</p> : (
          <ul className="space-y-2 text-sm">
            {recs.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-risk-low" aria-hidden /><span className="raw">{r.title}{!r.title.includes(r.object_name) && <span className="text-xs text-slate-500"> · {r.object_name}</span>}</span></li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
