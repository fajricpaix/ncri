import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card } from "@/components/ui/Card";
import { ProviderLabel } from "@/features/ai/AnalysisView";
import { AskForm } from "@/features/ai/AskForm";
import { api, getMe } from "@/lib/api-server";
import type { Answer, CulturalObject, Region } from "@/types/api";

async function Content() {
  const me = await getMe();
  if (me.role === "VIEWER")
    return <Card><p className="text-sm text-slate-600">Asisten AI hanya untuk Analyst, Reviewer, dan Admin. Role Anda: {me.role}.</p></Card>;
  const [provinces, objects, history] = await Promise.all([
    api<Region[]>("/regions?level=PROVINCE"), api<CulturalObject[]>("/cultural-objects?limit=200"), api<Answer[]>("/llm/assistant/history"),
  ]);
  return (
    <div className="space-y-4">
      <Card title="Tanya Data NCRI">
        <p className="mb-3 text-sm text-slate-600">Jawaban hanya berasal dari data NCRI pada cakupan yang dipilih, wajib menyertakan bukti, dan bisa menjawab “data tidak cukup”. Bukan keputusan; tinjau sebelum dipakai.</p>
        <AskForm provinces={provinces} objects={objects} />
      </Card>
      <Card title="Riwayat Pertanyaan Anda">
        {history.length === 0 ? <p className="text-sm text-slate-500">Belum ada pertanyaan.</p> : (
          <ul className="space-y-4">
            {history.map((a) => (
              <li key={a.id} className="space-y-2 rounded-xl p-4 ring-1 ring-slate-200">
                <p className="text-sm"><b>Q:</b> {a.question} <span className="text-xs text-slate-500">· cakupan {a.scope}</span></p>
                <p className="text-sm"><b>A:</b> {a.answer}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <ProviderLabel provider={a.provider} model={a.model} />
                  {a.answerable
                    ? <span className="rounded bg-blue-50 px-1.5 text-blue-800">{a.evidence_refs.length} bukti</span>
                    : <span className="rounded bg-amber-50 px-1.5 font-semibold text-amber-800 ring-1 ring-amber-200">DATA TIDAK CUKUP</span>}
                </div>
                <ul className="ml-4 list-disc text-xs text-slate-600">{a.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function AiAssistant() {
  return <Suspense fallback={<PageLoader label="Memuat…" />}><Content /></Suspense>;
}
