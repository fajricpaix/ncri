"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";

const ACTIONS = [
  ["IN_REVIEW", "Tinjau"],
  ["RESOLVED", "Selesai"],
  ["DISMISSED", "Abaikan"],
] as const;

export function WarningActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const allowed = useCan("triage");
  if (!allowed) return <span className="text-xs text-slate-400">hanya lihat</span>;

  async function set(next: string) {
    setBusy(true);
    setErr(false);
    try {
      const r = await apiFetch(`/early-warnings/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {ACTIONS.filter(([s]) => s !== status).map(([s, label]) => (
        <button key={s} disabled={busy} onClick={() => set(s)}
          className="rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">
          {label}
        </button>
      ))}
      {err && <span role="alert" className="text-xs text-risk-high">gagal</span>}
    </span>
  );
}
