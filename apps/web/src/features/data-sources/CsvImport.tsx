"use client";
import { useState } from "react";
import { API, apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";
import type { ImportReport } from "@/types/api";
import { Select } from "@/components/ui/Select";

type State =
  | { step: "idle" }
  | { step: "busy"; label: string }
  | { step: "report"; report: ImportReport }
  | { step: "done"; report: ImportReport }
  | { step: "error"; message: string };

const KINDS = [
  ["sources", "1. Sumber Data"],
  ["objects", "2. Objek Budaya"],
  ["observations", "3. Observasi Indikator"],
] as const;

const INFO: Record<string, { what: string; cols: string; note: string }> = {
  sources: {
    what: "Daftar asal data: lembaga, survei, atau situs yang menjadi rujukan angka dan objek. Tiap data di NCRI wajib menunjuk ke satu sumber.",
    cols: "Wajib: code, name, source_type (GOVERNMENT, COMMUNITY, SURVEY, PUBLIC_DATA, MANUAL). Opsional: description, access_method, terms_url, license_notes.",
    note: "Impor ini PERTAMA. Kode sumber (code) dipakai oleh file objek dan observasi.",
  },
  objects: {
    what: "Daftar objek budaya yang dipantau (tari, musik, kerajinan, tradisi lisan, dll) beserta provinsinya.",
    cols: "Wajib: external_code, name, category, region_code, data_origin (PUBLIC atau PARTNER). Opsional: description, latitude, longitude, inventory_status, source_code.",
    note: "Impor KEDUA, setelah sumber. Kode yang sama diperbarui, bukan digandakan.",
  },
  observations: {
    what: "Nilai indikator per objek dan per periode (mis. jumlah pelaku, penerus, pertunjukan). Skor risiko dihitung dari perubahan nilai antar periode.",
    cols: "Wajib: object_external_code, indicator_code, period_start, period_end (YYYY-MM-DD), value_numeric, source_code, data_origin. Nilai kosong dianggap data hilang, bukan nol.",
    note: "Impor TERAKHIR, setelah sumber dan objek. Tiap objek butuh minimal 3 indikator di 2 periode setara agar bisa dinilai. Setelah impor, klik Hitung Ulang Risiko.",
  },
};

export function CsvImport() {
  const [kind, setKind] = useState<string>("sources");
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
      const r = await apiFetch(`/data-imports/csv?kind=${kind}&commit=${commit}`, { method: "POST", body });
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
          <span className="sr-only">Jenis Data</span>
          <Select value={kind} onValueChange={(v) => { setKind(v); setState({ step: "idle" }); }}
            className="min-w-56">
            {KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </Select>
        </label>
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
        <a href={`${API}/data-imports/template.csv?kind=${kind}`} className="text-sm text-navy-2 underline">Unduh template CSV</a>
      </div>

      <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p><b className="text-navy">{KINDS.find(([k]) => k === kind)?.[1].replace(/^\d\. /, "")}:</b> {INFO[kind].what}</p>
        <p><b>Kolom CSV.</b> {INFO[kind].cols}</p>
        <p><b>Urutan.</b> {INFO[kind].note}</p>
      </div>
      <div className="overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil, tidak butuh optimasi next/image */}
        <img src={`/csv-examples/${kind}.svg`} alt={`Contoh format CSV ${kind}`} className="h-auto max-w-none sm:max-w-full" />
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
