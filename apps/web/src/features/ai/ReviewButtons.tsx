"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";

export function ReviewButtons({ url }: { url: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const allowed = useCan("review");
  if (!allowed) return <span className="text-xs text-slate-400">menunggu Reviewer</span>;

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(true);
    setErr(false);
    try {
      const r = await apiFetch(url, { method: "POST", body: JSON.stringify({ decision }) });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button disabled={busy} onClick={() => decide("APPROVED")} className="rounded-md bg-risk-low px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Setujui</button>
      <button disabled={busy} onClick={() => decide("REJECTED")} className="rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ring-slate-300 disabled:opacity-50">Tolak</button>
      {err && <span role="alert" className="text-xs text-risk-high">gagal</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-50 text-amber-800 ring-amber-200",
    APPROVED: "bg-green-50 text-risk-low ring-green-200",
    REJECTED: "bg-slate-100 text-slate-600 ring-slate-300",
  };
  const label: Record<string, string> = { DRAFT: "DRAFT · belum ditinjau manusia", APPROVED: "DISETUJUI", REJECTED: "DITOLAK" };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${map[status] ?? map.DRAFT}`}>{label[status] ?? status}</span>;
}
