"use client";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CulturalObject, Region } from "@/types/api";
import { Select } from "@/components/ui/Select";

const SUGGESTIONS = ["Objek mana yang paling berisiko dan mengapa?", "Bagaimana kualitas dan kemutakhiran datanya?", "Indikator apa yang paling menurun?"];

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
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <label className="block text-sm font-medium">
          Cakupan
          <Select className="mt-1 w-full" value={type} onValueChange={(v) => { setType(v as typeof type); setScopeId(""); }}>
            <option value="national">Nasional</option><option value="province">Provinsi</option><option value="object">Satu objek</option>
          </Select>
        </label>
        {type === "province" && (
          <label className="block text-sm font-medium">
            Provinsi
            <Select required className="mt-1 w-full" value={scopeId} onValueChange={setScopeId}>
              <option value="">Pilih provinsi…</option>{provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </Select>
          </label>
        )}
        {type === "object" && (
          <label className="block text-sm font-medium">
            Objek budaya
            <Select required className="mt-1 w-full" value={scopeId} onValueChange={setScopeId}>
              <option value="">Pilih objek…</option>{objects.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </label>
        )}
      </div>
      <div>
        <label htmlFor="q" className="text-sm font-medium">Pertanyaan</label>
        <textarea id="q" required minLength={3} maxLength={500} rows={3} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Tanyakan sesuatu tentang data NCRI…" className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold" />
        <p className="mt-1 text-right text-xs text-slate-500">{q.length}/500</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">Contoh pertanyaan</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full px-3 py-1.5 text-xs normal-case ring-1 ring-slate-300 hover:bg-slate-50">{s}</button>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-risk-high">{error}</p>}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button disabled={busy || (needsScope && !scopeId)} className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          <Send size={15} aria-hidden />{busy ? "Menjawab…" : "Tanya"}
        </button>
      </div>
    </form>
  );
}
