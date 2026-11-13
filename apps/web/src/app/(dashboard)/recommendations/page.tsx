import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { ProviderLabel } from "@/features/ai/AnalysisView";
import { ReviewButtons, StatusBadge } from "@/features/ai/ReviewButtons";
import { api } from "@/lib/api-server";
import type { Recommendation } from "@/types/api";

async function List() {
  const rows = await api<Recommendation[]>("/recommendations");
  if (!rows.length) return <p className="text-sm text-slate-600">Belum ada draft rekomendasi. Buat dari halaman detail objek budaya (panel “AI Insight”).</p>;
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <article key={r.id} className="space-y-2 rounded-xl p-4 ring-1 ring-slate-200">
          <header className="flex flex-wrap items-center gap-2">
            <Link href={`/cultural-repository/${r.cultural_object_id}`} className="font-semibold text-navy-2 hover:underline">{r.object_name}</Link>
            <StatusBadge status={r.status} />
            <ProviderLabel provider={r.provider} />
          </header>
          <p className="text-sm">{r.problem_statement}</p>
          <ul className="ml-4 list-disc text-sm">
            {r.recommended_actions.map((a, i) => <li key={i}>{a.action} <span className="text-xs text-slate-500">({a.time_horizon})</span></li>)}
          </ul>
          {r.suggested_kpis.length > 0 && <p className="text-xs text-slate-500">KPI: {r.suggested_kpis.join("; ")}</p>}
          {r.root_cause_hypotheses.length > 0 && <p className="text-xs text-amber-800">Menyertakan {r.root_cause_hypotheses.length} hipotesis yang belum divalidasi.</p>}
          {r.status === "DRAFT" && <ReviewButtons url={`/recommendations/${r.id}/review`} />}
        </article>
      ))}
    </div>
  );
}

export default function Recommendations() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Recommendation Engine</h2>
      <p className="text-sm text-slate-600">Semua rekomendasi berstatus draft sampai disetujui manusia.</p>
      <Card><Suspense fallback={<PageLoader label="Memuat…" />}><List /></Suspense></Card>
    </div>
  );
}
