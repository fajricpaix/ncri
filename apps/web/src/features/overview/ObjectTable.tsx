import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Eye, Plus } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { RiskLevelName } from "@/types/api";

export type Row = { id: string; name: string; category: string; province: string; score: number | null; level: RiskLevelName };

const SCORE_CLS: Record<RiskLevelName, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" };
export const PAGE_SIZE = 6;

export function ObjectTable({ rows, total, page, selected, href, csvHref, canAdd, heading }: {
  heading?: React.ReactNode;
  rows: Row[]; total: number; page: number; selected: string | null;
  href: (o: Record<string, string | number>) => string; csvHref: string; canAdd: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <section id="objek" className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        {heading ?? <h2 className="border-b-2 border-navy pb-1 text-base font-bold text-navy">Daftar Objek Budaya</h2>}
        <div className="flex gap-2">
          <a href={csvHref} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50"><Download size={14} aria-hidden />Ekspor</a>
          {canAdd && <Link href="/cultural-repository/new" className="inline-flex items-center gap-1.5 btn-gold px-3 py-1.5 text-sm font-semibold text-navy"><Plus size={14} aria-hidden />Tambah Data</Link>}
        </div>
      </header>
      <div className="overflow-x-auto px-4 pb-2">
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead className="bg-navy text-xs text-white">
            <tr><th className="rounded-l-lg px-3 py-2.5">Objek Budaya</th><th>Jenis Budaya</th><th>Provinsi</th><th>Skor Risiko ↓</th><th>Tingkat Risiko</th><th className="rounded-r-lg px-3">Aksi</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">Tidak ada objek yang cocok dengan filter.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className={`border-b border-slate-100 ${selected === r.id ? "bg-gold-soft/40" : "hover:bg-slate-50"}`}>
                <td className="raw px-3 py-3 font-semibold">
                  <Link href={`/cultural-repository/${r.id}`} className="text-navy-2 hover:underline">{r.name}</Link>
                </td>
                <td className="raw">{r.category}</td>
                <td className="raw">{r.province}</td>
                <td>{r.score === null ? "—" : <span className={`inline-block min-w-10 rounded-md px-2 py-1 text-center text-xs font-bold text-white ${SCORE_CLS[r.level]}`}>{r.score.toFixed(0)}</span>}</td>
                <td><RiskBadge level={r.level} /></td>
                <td className="px-3"><Link href={`/cultural-repository/${r.id}`} aria-label={`Detail ${r.name}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50"><Eye size={14} aria-hidden />Detail</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-2 text-sm text-slate-600">
        <span>Menampilkan {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari <b>{total.toLocaleString("id-ID")}</b> objek</span>
        <nav aria-label="Halaman" className="flex items-center gap-1">
          {page > 1 && <Link href={href({ page: page - 1 })} aria-label="Sebelumnya" className="rounded-md p-1.5 hover:bg-slate-100"><ChevronLeft size={16} /></Link>}
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && n - nums[i - 1] > 1 && <span aria-hidden>…</span>}
              <Link href={href({ page: n })} aria-current={n === page ? "page" : undefined} className={`min-w-8 rounded-md px-2 py-1 text-center font-semibold ${n === page ? "bg-navy text-white" : "hover:bg-slate-100"}`}>{n}</Link>
            </span>
          ))}
          {page < pages && <Link href={href({ page: page + 1 })} aria-label="Berikutnya" className="rounded-md p-1.5 hover:bg-slate-100"><ChevronRight size={16} /></Link>}
        </nav>
      </footer>
    </section>
  );
}
