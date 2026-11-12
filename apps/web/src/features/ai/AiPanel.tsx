"use client";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";
import type { Analysis } from "@/types/api";
import { AnalysisView, ProviderLabel } from "./AnalysisView";
import { ReviewButtons, StatusBadge } from "./ReviewButtons";

const KINDS = [
  ["risk-explanation", "Jelaskan risiko"],
  ["root-cause", "Hipotesis akar masalah"],
  ["recommendations", "Draft rekomendasi"],
] as const;
const TITLE = { RISK_EXPLANATION: "Penjelasan risiko", ROOT_CAUSE: "Akar masalah", RECOMMENDATION: "Rekomendasi" } as const;

export function AiPanel({ objectId, analyses }: { objectId: string; analyses: Analysis[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canGenerate = useCan("analyze");

  async function generate(kind: string) {
    setBusy(kind);
    setError(null);
    try {
      const r = await apiFetch(`/llm/${kind}`, { method: "POST", body: JSON.stringify({ cultural_object_id: objectId }) });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        const det = d.detail;
        setError(typeof det === "string" ? det : det?.message ? `${det.message}: ${det.errors?.join("; ")}` : `Error ${r.status}`);
      }
      router.refresh();
    } catch {
      setError("Gagal terhubung ke API");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Keluaran AI adalah <b>draft</b> yang hanya memakai data NCRI di atas dan tidak menentukan skor risiko. Wajib ditinjau manusia.
      </p>
      {!canGenerate && <p className="text-xs text-slate-500">Role Anda hanya dapat melihat analisis. Pembuatan draft oleh Analyst/Admin.</p>}
      <div className="flex flex-wrap gap-2">
        {canGenerate && KINDS.map(([k, label]) => (
          <button key={k} disabled={busy !== null} onClick={() => generate(k)}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Sparkles size={15} aria-hidden />{busy === k ? "Menyusun…" : label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-risk-high">{error}</p>}
      {analyses.length === 0 && <p className="text-sm text-slate-500">Belum ada analisis.</p>}
      {analyses.map((a) => (
        <article key={a.id} className="space-y-3 rounded-xl p-4 ring-1 ring-slate-200">
          <header className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{TITLE[a.analysis_type]}</h3>
            <StatusBadge status={a.review_status} />
            <ProviderLabel provider={a.provider} model={a.model} />
            <span className="ml-auto text-xs text-slate-400">prompt {a.prompt_version}</span>
          </header>
          {a.validation_errors.length > 0 ? (
            <ul role="alert" className="list-disc rounded-lg bg-red-50 p-3 pl-6 text-sm text-risk-high">
              <li className="list-none font-semibold">Ditolak guardrail, tidak dapat disetujui:</li>
              {a.validation_errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          ) : <AnalysisView o={a.output} />}
          {a.review_status === "DRAFT" && a.validation_errors.length === 0 && (
            <ReviewButtons url={`/llm/analyses/${a.id}/review`} />
          )}
        </article>
      ))}
    </div>
  );
}
