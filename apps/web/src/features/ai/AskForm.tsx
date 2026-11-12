"use client";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CulturalObject, Region } from "@/types/api";

const SUGGESTIONS = ["Objek mana yang paling berisiko dan mengapa?", "Bagaimana kualitas dan kemutakhiran datanya?", "Indikator apa yang paling menurun?"];
const sel = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export function AskForm({ provinces, objects }: { provinces: Region[]; objects: CulturalObject[] }) {
  const router = useRouter();
  const [type, setType] = useState<"national" | "province" | "object">("national");
  const [scopeId, setScopeId] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch("/llm/assistant", {
        method: "POST", body: JSON.stringify({ question: q, scope_type: type, scope_id: type === "national" ? null : scopeId }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))).detail;
        setError(typeof d === "string" ? d : d?.message ? `${d.message}: ${d.errors?.join("; ")}` : `Error ${r.status}`);
      } else {
        setQ("");
        router.refresh();
      }
    } catch {
      setError("Gagal terhubung ke API");
    } finally {
      setBusy(false);
    }
  }

  const needsScope = type !== "national";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="text-sm font-medium">Cakupan
          <select className={`${sel} ml-2`} value={type} onChange={(e) => { setType(e.target.value as typeof type); setScopeId(""); }}>
            <option value="national">Nasional</option><option value="province">Provinsi</option><option value="object">Satu objek</option>
          </select>
        </label>
        {type === "province" && (
          <select aria-label="Provinsi" required className={sel} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
            <option value="">Pilih provinsi…</option>{provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        )}
        {type === "object" && (
          <select aria-label="Objek budaya" required className={sel} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
            <option value="">Pilih objek…</option>{objects.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>
      <label className="block text-sm font-medium">
        Pertanyaan
        <textarea required minLength={3} maxLength={500} rows={3} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Tanyakan sesuatu tentang data NCRI…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-gold" />
        <span className="text-xs font-normal text-slate-500">{q.length}/500</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full px-3 py-1 text-xs ring-1 ring-slate-300 hover:bg-slate-50">{s}</button>
        ))}
        <button disabled={busy || (needsScope && !scopeId)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          <Send size={15} aria-hidden />{busy ? "Menjawab…" : "Tanya"}
        </button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-risk-high">{error}</p>}
    </form>
  );
}
