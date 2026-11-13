"use client";
import { useState } from "react";
import { API, apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";
import type { ImportReport } from "@/types/api";

type State =
  | { step: "idle" }
  | { step: "busy"; label: string }
  | { step: "report"; report: ImportReport }
  | { step: "done"; report: ImportReport }
  | { step: "error"; message: string };

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<State>({ step: "idle" });
  const allowed = useCan("analyze");
  if (!allowed) return <p className="text-sm text-slate-600">Import data hanya untuk Analyst/Admin.</p>;

  async function send(commit: boolean) {
    if (!file) return;
    setState({ step: "busy", label: commit ? "Mengimpor…" : "Memvalidasi…" });
    const body = new FormData();
    body.append("file", file);
    try {
      const r = await apiFetch(`/data-imports/csv?commit=${commit}`, { method: "POST", body });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(typeof d.detail === "string" ? d.detail : `Error ${r.status}`);
      }
      const report: ImportReport = await r.json();
      setState({ step: commit ? "done" : "report", report });
    } catch (e) {
      setState({ step: "error", message: e instanceof Error ? e.message : "Gagal terhubung ke API" });
    }
  }

  const busy = state.step === "busy";
  const report = state.step === "report" || state.step === "done" ? state.report : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">
          <span className="sr-only">File CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setState({ step: "idle" }); }}
            className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-white"
          />
        </label>
        <button disabled={!file || busy} onClick={() => send(false)}
          className="btn-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">
          Validasi & pratinjau
        </button>
        <a href={`${API}/data-imports/template.csv`} className="text-sm text-navy-2 underline">Unduh template CSV</a>
      </div>

      {busy && <p role="status" className="text-sm text-slate-500">{state.label}</p>}
      {state.step === "error" && <p role="alert" className="text-sm text-risk-high">{state.message}</p>}

      {report && (
        <div role="status" className="space-y-3">
          <p className="text-sm">
            {state.step === "done" ? "Import selesai: " : "Hasil validasi: "}
            <b>{report.records_valid}</b> valid dari <b>{report.records_total}</b> baris, <b>{report.records_failed}</b> ditolak.
          </p>
          {report.errors.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-lg bg-red-50 p-3 text-sm text-risk-high">
              {report.errors.map((e, i) => <li key={i}>Baris {e.row} · {e.field}: {e.message}</li>)}
            </ul>
          )}
          {state.step === "report" && (
            report.records_valid > 0 ? (
              <button disabled={busy} onClick={() => send(true)} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
                Impor {report.records_valid} baris valid
              </button>
            ) : <p className="text-sm text-slate-600">Tidak ada baris valid untuk diimpor.</p>
          )}
        </div>
      )}
    </div>
  );
}
