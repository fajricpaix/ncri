import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Focus } from "@/features/ai-predictive-risk-engine/Focus";
import { Scenario } from "@/features/ai-predictive-risk-engine/Scenario";
import { projectScore } from "@/features/ai-predictive-risk-engine/sim";
import { api } from "@/lib/api-server";
import type { ProvinceSummary, Risk } from "@/types/api";

async function Content({ params }: { params: PageProps<"/ai-predictive-risk-engine/[id]">["params"] }) {
  const { id } = await params;
  const [risk, provinces] = await Promise.all([api<Risk>(`/cultural-objects/${id}/risk`), api<ProvinceSummary[]>("/map/provinces")]);
  const province = provinces.find((p) => p.objects.some((o) => o.id === id))?.name ?? "—";
  const base2028 = risk.risk_score === null ? null : projectScore(risk.risk_score)[3].mid;
  return (
    <div className="space-y-4">
      <Link href="/ai-predictive-risk-engine" className="cap inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ArrowLeft size={14} aria-hidden />Kembali ke AI Predictive Risk Engine</Link>
      <div className="grid gap-4 xl:grid-cols-4 [&>*]:min-w-0"><Suspense fallback={<p className="text-sm text-slate-500">Memuat detail…</p>}><Focus id={id} province={province} wide /></Suspense></div>
      {base2028 !== null && <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0"><Scenario base={base2028} /></div>}
      <p className="text-xs text-slate-500">Data historis dan indikator lengkap: <Link href={`/cultural-repository/${id}`} className="underline">halaman objek budaya</Link>.</p>
    </div>
  );
}

export default function Page(props: PageProps<"/ai-predictive-risk-engine/[id]">) {
  return <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}><Content params={props.params} /></Suspense>;
}
