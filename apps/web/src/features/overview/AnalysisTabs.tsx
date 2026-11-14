import Link from "next/link";
import { api } from "@/lib/api-server";
import type { Overview, Risk, RiskLevelName } from "@/types/api";
import type { Row } from "@/features/overview/ObjectTable";

export const TABS = [["objek", "Daftar Objek Budaya"], ["faktor", "Analisis Faktor Risiko"], ["heatmap", "Heatmap Wilayah"], ["tren", "Perbandingan Tren"]] as const;
export type TabId = (typeof TABS)[number][0];

export function TabNav({ active, href }: { active: TabId; href: (o: Record<string, string | number>) => string }) {
  return (
    <nav aria-label="Tab analisis" className="flex flex-wrap gap-x-5 gap-y-1">
      {TABS.map(([id, label]) => (
        <Link key={id} href={href({ tab: id === "objek" ? "" : id, page: 1 })} scroll={false} aria-current={id === active ? "page" : undefined}
          className={`border-b-2 pb-1 text-sm ${id === active ? "border-navy font-bold text-navy" : "border-transparent text-slate-600 hover:text-navy"}`}>{label}</Link>
      ))}
    </nav>
  );
}

const soft = <T,>(p: Promise<T>) => p.catch(() => null as T | null);

// Rata-rata kontribusi tiap indikator ke skor, atas objek yang sedang difilter.
export async function FactorAnalysis({ rows }: { rows: Row[] }) {
  const ids = rows.filter((r) => r.score !== null).slice(0, 80).map((r) => r.id);
  const risks = (await Promise.all(ids.map((id) => soft(api<Risk>(`/cultural-objects/${id}/risk`))))).filter((r): r is Risk => !!r);
  const agg = new Map<string, { name: string; sum: number; top: number }>();
  risks.forEach((r) => {
    const sorted = [...r.factors].sort((a, b) => b.contribution - a.contribution);
    sorted.forEach((f, i) => {
      const a = agg.get(f.indicator_code) ?? { name: f.indicator_name, sum: 0, top: 0 };
      a.sum += f.contribution; if (i === 0) a.top += 1;
      agg.set(f.indicator_code, a);
    });
  });
  const list = [...agg.values()].map((a) => ({ ...a, avg: a.sum / risks.length })).sort((a, b) => b.avg - a.avg);
  if (!list.length) return <p className="text-sm text-slate-600">Belum ada faktor risiko untuk objek yang difilter.</p>;
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-slate-500">Rata-rata kontribusi tiap indikator ke skor, dari {risks.length} objek yang dinilai{ids.length === 80 ? " (dibatasi 80)" : ""}.</p>
      <ul className="space-y-2">
        {list.map((f) => (
          <li key={f.name} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] items-center gap-3">
            <span className="raw truncate" title={f.name}>{f.name}</span>
            <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-risk-high" style={{ width: `${(f.avg / list[0].avg) * 100}%` }} /></div>
            <span className="text-xs"><b>{f.avg.toFixed(1)}</b> <span className="text-slate-500">· faktor utama di {f.top} objek</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CELL: [RiskLevelName, string, string][] = [["HIGH", "Tinggi", "214,69,69"], ["MEDIUM", "Sedang", "232,163,23"], ["LOW", "Rendah", "46,158,91"], ["INSUFFICIENT_DATA", "Data Kurang", "138,148,166"]];

export function RegionHeatmap({ rows, href }: { rows: (Row & { pcode: string })[]; href: (o: Record<string, string | number>) => string }) {
  const by = new Map<string, { name: string; code: string; c: Record<string, number> }>();
  rows.forEach((r) => {
    const p = by.get(r.pcode) ?? { name: r.province, code: r.pcode, c: {} };
    p.c[r.level] = (p.c[r.level] ?? 0) + 1; by.set(r.pcode, p);
  });
  const list = [...by.values()].sort((a, b) => (b.c.HIGH ?? 0) - (a.c.HIGH ?? 0) || a.name.localeCompare(b.name));
  const max = Math.max(1, ...list.flatMap((p) => Object.values(p.c)));
  if (!list.length) return <p className="text-sm text-slate-600">Tidak ada objek yang cocok dengan filter.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-center text-sm">
        <thead className="cap text-xs text-slate-500"><tr><th className="py-1 text-left">Provinsi</th>{CELL.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.code} className="border-t border-slate-100">
              <td className="raw py-1.5 text-left"><Link href={href({ prov: p.code, page: 1, obj: "", tab: "" })} className="font-medium text-navy-2 hover:underline">{p.name}</Link></td>
              {CELL.map(([k, , rgb]) => { const n = p.c[k] ?? 0; return <td key={k} className="px-1"><span className="block rounded-md py-1 font-semibold" style={{ background: n ? `rgba(${rgb},${0.15 + 0.75 * (n / max)})` : "transparent", color: n / max > 0.6 ? "#fff" : undefined }}>{n || "·"}</span></td>; })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const id1 = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export function TrendCompare({ trend, rows }: { trend: Overview["trend"]; rows: Row[] }) {
  const cats = new Map<string, number[]>();
  rows.forEach((r) => r.score !== null && cats.set(r.category, [...(cats.get(r.category) ?? []), r.score]));
  const catRows = [...cats].map(([c, s]) => ({ c, n: s.length, avg: s.reduce((a, b) => a + b, 0) / s.length, high: s.filter((x) => x >= 70).length })).sort((a, b) => b.avg - a.avg);
  const d = (cur: number, prev?: number) => (prev === undefined ? "" : cur - prev === 0 ? " (=)" : ` (${cur - prev > 0 ? "+" : ""}${cur - prev})`);
  return (
    <div className="grid gap-6 text-sm lg:grid-cols-2">
      <div>
        <h4 className="mb-2 font-bold text-navy">Nasional per Periode</h4>
        <table className="w-full text-left"><thead className="cap text-xs text-slate-500"><tr><th>Periode</th><th>Tinggi</th><th>Sedang</th><th>Rendah</th></tr></thead>
          <tbody>{trend.map((t, i) => (
            <tr key={t.period_end} className="border-t border-slate-100"><td className="py-1.5">{t.period_end.slice(0, 4)}</td>
              {(["HIGH", "MEDIUM", "LOW"] as const).map((k) => <td key={k}>{t[k]}<span className="text-xs text-slate-500">{d(t[k], trend[i - 1]?.[k])}</span></td>)}</tr>
          ))}</tbody></table>
        <p className="mt-1 text-xs text-slate-500">Angka dalam kurung = selisih dari periode sebelumnya. Tidak ikut filter.</p>
      </div>
      <div>
        <h4 className="mb-2 font-bold text-navy">Jenis Budaya (Kondisi Terkini, Sesuai Filter)</h4>
        <table className="w-full text-left"><thead className="cap text-xs text-slate-500"><tr><th>Jenis</th><th>Objek</th><th>Skor Rata-rata</th><th>Risiko Tinggi</th></tr></thead>
          <tbody>{catRows.map((r) => <tr key={r.c} className="border-t border-slate-100"><td className="raw py-1.5">{r.c}</td><td>{r.n}</td><td className="font-semibold">{id1(r.avg)}</td><td>{r.high}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
