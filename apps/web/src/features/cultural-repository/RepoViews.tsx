import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Eye, FileWarning, Gauge, HelpCircle, ShieldAlert, type LucideIcon } from "lucide-react";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ObjectThumb } from "@/features/ai-predictive-risk-engine/ObjectThumb";
import type { CulturalObject, RiskLevelName } from "@/types/api";

export type RepoRow = CulturalObject & { province: string; score: number | null; level: RiskLevelName; confidence: number | null };

export const TABS = [["daftar", "Daftar Objek"], ["jenis", "Per Jenis Budaya"], ["provinsi", "Per Provinsi"], ["kualitas", "Kualitas Data"]] as const;
export type TabId = (typeof TABS)[number][0];

const SCORE_CLS: Record<RiskLevelName, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" };
const th = "px-3 py-2.5 whitespace-nowrap";
const wrap = "overflow-x-auto rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200";
const head = "bg-navy text-xs text-white [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg";

export function TabNav({ active, href }: { active: TabId; href: (t: TabId) => string }) {
  return (
    <nav aria-label="Tampilan" className="flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map(([id, label]) => (
        <Link key={id} href={href(id)} aria-current={id === active ? "page" : undefined}
          className={`cap -mb-px border-b-2 px-3 py-2 text-sm font-semibold ${id === active ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-navy"}`}>{label}</Link>
      ))}
    </nav>
  );
}

export function ObjectsTable({ rows }: { rows: RepoRow[] }) {
  if (!rows.length) return <p className={`${wrap} text-center text-sm text-slate-500`}>Tidak ada objek yang cocok dengan filter.</p>;
  return (
    <div className={wrap}>
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className={head}><tr><th className={th}>Objek Budaya</th><th>Jenis</th><th>Provinsi</th><th>Skor</th><th>Risiko</th><th>Confidence</th><th>Verifikasi</th><th>Asal Data</th><th className={th}>Aksi</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2">
                <Link href={`/cultural-repository/${o.id}`} className="flex items-center gap-3">
                  <ObjectThumb name={o.name} size={40} />
                  <span className="raw font-semibold text-navy-2 hover:underline">{o.name}<span className="block text-xs font-normal text-slate-500">{o.external_code}</span></span>
                </Link>
              </td>
              <td className="raw">{o.category}</td>
              <td className="raw">{o.province}</td>
              <td>{o.score === null ? "—" : <span className={`inline-block min-w-10 rounded-md px-2 py-1 text-center text-xs font-bold text-white ${SCORE_CLS[o.level]}`}>{o.score.toFixed(0)}</span>}</td>
              <td><RiskBadge level={o.level} /></td>
              <td>{o.confidence === null ? "—" : o.confidence.toFixed(2).replace(".", ",")}</td>
              <td className="text-xs">{o.verification_status === "VERIFIED" ? "Terverifikasi" : "Belum"}</td>
              <td><OriginBadge origin={o.data_origin} /></td>
              <td className="px-3"><Link href={`/cultural-repository/${o.id}`} aria-label={`Detail ${o.name}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50"><Eye size={14} aria-hidden />Detail</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LV: [RiskLevelName, string][] = [["HIGH", "#d64545"], ["MEDIUM", "#e8a317"], ["LOW", "#2e9e5b"], ["INSUFFICIENT_DATA", "#8a94a6"]];

// Ringkasan per kelompok: jumlah, skor rata-rata, bar tumpuk sebaran risiko.
export function GroupTable({ rows, by, label }: { rows: RepoRow[]; by: (r: RepoRow) => string; label: string }) {
  const g = new Map<string, RepoRow[]>();
  rows.forEach((r) => g.set(by(r), [...(g.get(by(r)) ?? []), r]));
  const list = [...g].map(([name, rs]) => {
    const sc = rs.flatMap((r) => (r.score === null ? [] : [r.score]));
    return { name, rs, avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  return (
    <div className={wrap}>
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className={head}><tr><th className={th}>{label}</th><th>Objek</th><th>Skor Rata-rata</th><th className="w-1/3">Sebaran Risiko</th><th className={th}>Tinggi</th></tr></thead>
        <tbody>
          {list.map(({ name, rs, avg }) => (
            <tr key={name} className="border-b border-slate-100">
              <td className="raw px-3 py-2.5 font-medium">{name}</td>
              <td>{rs.length}</td>
              <td>{avg === null ? "—" : avg.toFixed(0)}</td>
              <td>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Sebaran tingkat risiko">
                  {LV.map(([l, c]) => <span key={l} style={{ width: `${(rs.filter((r) => r.level === l).length / rs.length) * 100}%`, background: c }} />)}
                </div>
              </td>
              <td className="px-3 font-semibold text-risk-high">{rs.filter((r) => r.level === "HIGH").length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const QUALITY_ICONS: LucideIcon[] = [ShieldAlert, Gauge, HelpCircle];

// Objek yang datanya perlu dibenahi: belum terverifikasi, confidence < 0,5, atau belum dinilai.
export function DataQuality({ rows }: { rows: RepoRow[] }) {
  const n = (f: (r: RepoRow) => boolean) => rows.filter(f).length;
  const stats: [string, number][] = [
    ["Belum Terverifikasi", n((r) => r.verification_status !== "VERIFIED")],
    ["Confidence Rendah (<0,5)", n((r) => r.confidence !== null && r.confidence < 0.5)],
    ["Belum Dinilai", n((r) => r.level === "INSUFFICIENT_DATA")],
  ];
  const issues = rows.filter((r) => r.verification_status !== "VERIFIED" || (r.confidence !== null && r.confidence < 0.5) || r.level === "INSUFFICIENT_DATA");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map(([l, v], i) => <StatCard key={l} icon={QUALITY_ICONS[i] ?? FileWarning} tone={(["amber", "red", "slate", "purple"] as const)[i] ?? "blue"} label={l} value={v} />)}
      </div>
      <p className="text-sm text-slate-600">Objek yang perlu dibenahi datanya ({issues.length}):</p>
      <ObjectsTable rows={issues} />
    </div>
  );
}
