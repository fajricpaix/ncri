"use client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";

export function RunRiskButton({ objectId }: { objectId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const allowed = useCan("analyze");
  if (!allowed) return null;

  async function run() {
    setState("busy");
    try {
      const r = await apiFetch("/analytics/risk/run", {
        method: "POST", body: JSON.stringify({ cultural_object_id: objectId ?? null }),
      });
      if (!r.ok) throw new Error();
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={run} disabled={state === "busy"}
        className="inline-flex items-center gap-2 btn-gold px-3 py-2 text-sm font-semibold text-navy disabled:opacity-60">
        <RefreshCw size={16} className={state === "busy" ? "animate-spin" : ""} aria-hidden />
        {state === "busy" ? "Menghitung…" : "Hitung ulang risiko"}
      </button>
      {state === "error" && <span role="alert" className="text-sm text-risk-high">Gagal menghitung</span>}
    </span>
  );
}
