"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

export type LlmSettingsData = {
  provider: string; model: string; source: "database" | "env";
  api_key_set: boolean; api_key_hint: string | null; default_models: Record<string, string>;
};
const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-gold";

export function LlmSettings({ data }: { data: LlmSettingsData }) {
  const router = useRouter();
  const [provider, setProvider] = useState(data.provider in data.default_models ? data.provider : "gemini");
  const [model, setModel] = useState(data.source === "database" ? data.model : "");
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(path: string, method: string, body?: object, okText?: string) {
    setBusy(true); setMsg(null);
    const r = await apiFetch(path, { method, body: body && JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: typeof d.detail === "string" ? d.detail : "Gagal: periksa isian." });
    setMsg({ ok: true, text: okText ?? `OK: ${d.provider} / ${d.model}` });
    return d;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (await run("/admin/llm-settings", "PUT", { provider, model: model.trim() || null, api_key: apiKey.trim() || null }, "Tersimpan.")) {
      setApiKey(""); router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-sm text-slate-600">
        Status: <b>{data.provider || "nonaktif"}</b> ({data.model || "-"}), sumber {data.source === "database" ? "pengaturan ini" : "env server"}.
        Kunci API: {data.api_key_set ? `terisi ${data.api_key_hint ?? "(dari env)"}` : "belum diisi"}.
        {data.provider === "fake" && " Penyedia fake = contoh deterministik, bukan AI."}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Penyedia
          <select className={input} value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="gemini">Google Gemini (ada free tier)</option>
            <option value="anthropic">Anthropic (berbayar)</option>
          </select>
        </label>
        <label className="text-sm font-medium">Model (opsional)
          <input className={input} value={model} placeholder={data.default_models[provider]} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label className="text-sm font-medium">API key
          <input type="password" autoComplete="off" className={input} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder={data.api_key_hint ? "kosongkan = pakai kunci tersimpan" : provider === "gemini" ? "dari aistudio.google.com" : ""} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Simpan</button>
        <button type="button" disabled={busy} onClick={() => run("/admin/llm-settings/test", "POST")}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60">Tes koneksi</button>
        {data.source === "database" && (
          <button type="button" disabled={busy} onClick={async () => { if (await run("/admin/llm-settings", "DELETE", undefined, "Pengaturan dihapus, kembali ke env.")) router.refresh(); }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-risk-high disabled:opacity-60">Hapus pengaturan</button>
        )}
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-slate-700" : "text-risk-high"}`}>{msg.text}</p>}
      <p className="text-xs text-slate-500">Kunci disimpan terenkripsi di database dan tidak pernah ditampilkan lagi. Data yang dikirim ke penyedia: ringkasan skor & observasi indikator, tanpa data pribadi. Free tier Google dapat memakai data permintaan untuk peningkatan produk, jangan pakai data nyata yang sensitif.</p>
    </form>
  );
}
