import { CheckCircle2, ClipboardList, FileClock, XCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { PageLoader } from "@/components/ui/PageLoader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ProviderLabel } from "@/features/ai/AnalysisView";
import { ReviewButtons, StatusBadge } from "@/features/ai/ReviewButtons";
import { api } from "@/lib/api-server";
import type { Overview, Recommendation } from "@/types/api";

const TABS = [
  ["", "Semua"],
  ["DRAFT", "Menunggu Tinjauan"],
  ["APPROVED", "Disetujui"],
  ["REJECTED", "Ditolak"],
] as const;

function Evidence({ items }: { items: Recommendation["evidence"] }) {
  if (!items.length)
    return <p className="text-xs text-amber-800">Belum ada observasi yang dirujuk sebagai bukti. Rekomendasi ini belum bisa ditelusuri ke sumber data.</p>;
  const sources = new Set(items.map((e) => e.source_code));
  return (
    <details className="group rounded-lg bg-slate-50 ring-1 ring-slate-200">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-navy-2">
        Sumber Data · {items.length} bukti dari {sources.size} sumber
      </summary>
      <div className="overflow-x-auto px-3 pb-3">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr><th className="py-1 pr-3">Indikator</th><th className="pr-3">Nilai</th><th className="pr-3">Periode</th><th className="pr-3">Sumber</th><th>Asal</th></tr>
          </thead>
          <tbody>
            {items.map((e, i) => (
              <tr key={i} className="border-t border-slate-200 align-top">
                <td className="raw py-1.5 pr-3">{e.indicator}</td>
                <td className="pr-3 whitespace-nowrap">{e.value ?? "—"}{e.unit ? ` ${e.unit}` : ""}</td>
                <td className="pr-3 whitespace-nowrap">{e.period_end}</td>
                <td className="raw pr-3">
                  {e.source_url ? <a href={e.source_url} target="_blank" rel="noreferrer" className="underline">{e.source_name}</a> : e.source_name}
                  <span className="block text-[10px] text-slate-400">{e.source_code} · {e.verification}</span>
                </td>
                <td><OriginBadge origin={e.data_origin} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Item({ r }: { r: Recommendation }) {
  return (
    <article className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <header className="flex flex-wrap items-center gap-2">
        <Link href={`/cultural-repository/${r.cultural_object_id}`} className="raw font-semibold text-navy-2 hover:underline">{r.object_name}</Link>
        {r.risk_level && <RiskBadge level={r.risk_level} />}
        {r.risk_score !== null && <span className="text-xs text-slate-500">skor {r.risk_score.toFixed(1)}</span>}
        <span className="ml-auto flex items-center gap-2"><StatusBadge status={r.status} /><ProviderLabel provider={r.provider} /></span>
      </header>

      <p className="text-sm text-slate-800">{r.problem_statement}</p>

      <ol className="space-y-2">
        {r.recommended_actions.map((a, i) => (
          <li key={i} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">{i + 1}</span>
            <div className="min-w-0">
              <p>{a.action}</p>
              <p className="mt-1 text-xs text-slate-500">Sasaran: {a.target_group} · Horizon: {a.time_horizon}</p>
            </div>
          </li>
        ))}
      </ol>

      {r.suggested_kpis.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="cap font-semibold text-slate-600">KPI:</span>
          {r.suggested_kpis.map((k) => <span key={k} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800 ring-1 ring-blue-200">{k}</span>)}
        </div>
      )}
      {r.root_cause_hypotheses.length > 0 && (
        <p className="text-xs text-amber-800">Menyertakan {r.root_cause_hypotheses.length} hipotesis akar masalah yang belum divalidasi.</p>
      )}

      <Evidence items={r.evidence} />
      {r.status === "DRAFT" && <ReviewButtons url={`/recommendations/${r.id}/review`} />}
    </article>
  );
}

async function Content({ status }: { status: string }) {
  const all = await api<Recommendation[]>("/recommendations");
  const count = (s: string) => all.filter((r) => r.status === s).length;
  const top = all.length ? null : (await api<Overview>("/dashboard/overview").catch(() => null))?.priority[0];
  const rows = all.filter((r) => !status || r.status === status).sort((a, b) => Number(b.status === "DRAFT") - Number(a.status === "DRAFT"));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Rekomendasi" value={all.length} tone="blue" />
        <StatCard icon={FileClock} label="Menunggu Tinjauan" value={count("DRAFT")} tone="amber" />
        <StatCard icon={CheckCircle2} label="Disetujui" value={count("APPROVED")} tone="green" />
        <StatCard icon={XCircle} label="Ditolak" value={count("REJECTED")} tone="slate" />
      </div>

      <Card title="Daftar Rekomendasi" action={
        <nav className="flex gap-1 text-xs" aria-label="Filter status">
          {TABS.map(([v, l]) => (
            <Link key={v} href={v ? `?status=${v}` : "?"} className={`cap rounded-md px-2.5 py-1 ${status === v ? "bg-white text-navy" : "text-white/80 hover:bg-white/10"}`}>{l}</Link>
          ))}
        </nav>
      }>
        {rows.length === 0 ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p>{all.length === 0 ? "Belum ada draft rekomendasi. Buat dari panel “AI Insight” di halaman detail objek budaya (butuh penilaian risiko dan observasi bersumber)." : "Tidak ada rekomendasi dengan status ini."}</p>
            {all.length === 0 && (
              <p className="flex flex-wrap gap-2">
                {top && <Link href={`/cultural-repository/${top.id}#ai-insight`} className="cap rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white">Buka AI Insight: <span className="raw">{top.name}</span></Link>}
                <Link href="/cultural-repository" className="cap rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ring-slate-300">Pilih Objek Budaya</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">{rows.map((r) => <Item key={r.id} r={r} />)}</div>
        )}
      </Card>
    </div>
  );
}

export default async function Recommendations({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Semua rekomendasi berstatus draft sampai disetujui manusia. Setiap rekomendasi menampilkan bukti dan sumber datanya.</p>
      <Suspense fallback={<PageLoader label="Memuat…" />}><Content status={status} /></Suspense>
    </div>
  );
}
