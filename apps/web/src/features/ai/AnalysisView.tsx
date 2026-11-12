import type { LlmOutput } from "@/types/api";

export function ProviderLabel({ provider, model }: { provider: string | null; model?: string }) {
  if (provider === "fake")
    return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-300">CONTOH DETERMINISTIK · bukan AI</span>;
  return <span className="text-xs text-slate-500">{provider}{model ? ` · ${model}` : ""}</span>;
}

const refs = (n: number) => (
  <span className="ml-1 rounded bg-blue-50 px-1.5 text-[11px] text-blue-800" title="Jumlah observasi yang dirujuk sebagai bukti">
    {n} bukti
  </span>
);

export function AnalysisView({ o }: { o: LlmOutput }) {
  return (
    <div className="space-y-3 text-sm">
      <p>{o.summary}</p>
      {o.risk_drivers.length > 0 && (
        <section>
          <h4 className="font-semibold">Faktor risiko</h4>
          <ul className="ml-4 list-disc space-y-1">
            {o.risk_drivers.map((d, i) => (
              <li key={i}><b>{d.factor}</b>: {d.interpretation} <span className="text-slate-500">(confidence {d.confidence})</span>{refs(d.evidence_refs.length)}</li>
            ))}
          </ul>
        </section>
      )}
      {o.root_cause_hypotheses.length > 0 && (
        <section>
          <h4 className="font-semibold">Hipotesis akar masalah <span className="rounded bg-amber-50 px-1.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">HIPOTESIS · perlu validasi</span></h4>
          <ul className="ml-4 list-disc space-y-1.5">
            {o.root_cause_hypotheses.map((h, i) => (
              <li key={i}>{h.hypothesis} <span className="text-slate-500">(confidence {h.confidence})</span>{refs(h.supporting_evidence.length)}
                {h.missing_evidence.length > 0 && <span className="block text-xs text-slate-500">Bukti yang masih kurang: {h.missing_evidence.join("; ")}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {o.recommended_actions.length > 0 && (
        <section>
          <h4 className="font-semibold">Draft tindakan</h4>
          <ul className="ml-4 list-disc space-y-1.5">
            {o.recommended_actions.map((a, i) => (
              <li key={i}>{a.action}{refs(a.evidence_refs.length)}
                <span className="block text-xs text-slate-500">Sasaran: {a.target_group} · {a.time_horizon} · KPI: {a.suggested_kpis.join("; ") || "—"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h4 className="font-semibold">Keterbatasan</h4>
        <ul className="ml-4 list-disc text-slate-600">{o.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </section>
    </div>
  );
}
