"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Select } from "@/components/ui/Select";

export type LlmSettingsData = {
  provider: string; model: string; source: "database" | "env";
  api_key_set: boolean; api_key_hint: string | null; default_models: Record<string, string>; models: Record<string, string[]>;
  updated_at: string | null; last_test: { ok: boolean; message: string; at: string } | null;
};
const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold";
const selCls = "mt-1 w-full";

export function LlmSettings({ data }: { data: LlmSettingsData }) {
  const router = useRouter();
  const [provider, setProvider] = useState(data.provider in data.default_models ? data.provider : "gemini");
  const [model, setModel] = useState(data.source === "database" && data.models[provider]?.includes(data.model) ? data.model : data.default_models[provider]);
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [changeKey, setChangeKey] = useState(false);
  const active = data.source === "database" && data.api_key_set;

  async function run(path: string, method: string, body?: object, okText?: string) {
    setBusy(true); setMsg(null);
    const r = await apiFetch(path, { method, body: body && JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { router.refresh(); return setMsg({ ok: false, text: typeof d.detail === "string" ? d.detail : Array.isArray(d.detail) ? `Gagal: ${d.detail.map((x: { loc?: string[]; msg?: string }) => `${x.loc?.slice(1).join(".")} ${x.msg}`).join("; ")}` : `Gagal (HTTP ${r.status})` }); }
    setMsg({ ok: true, text: okText ?? `Berhasil: ${d.provider} / ${d.model} merespons.` });
    router.refresh();
    return d;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (await run("/admin/llm-settings", "PUT", { provider, model, api_key: apiKey.trim() || null }, "Tersimpan.")) {
      setApiKey(""); setChangeKey(false); router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm ${active ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        <span className="font-semibold">{active ? "✓ Terkonfigurasi" : data.provider === "fake" ? "Belum aktif (mode contoh, bukan AI)" : "Belum lengkap"}</span>
        <span>Penyedia: <b>{data.provider || "nonaktif"}</b></span>
        <span>Model: <b>{data.model || "-"}</b></span>
        <span>API key: <b>{data.api_key_set ? (data.api_key_hint ? `••••••••${data.api_key_hint.replace("…", "")}` : "dari env server") : "belum diisi"}</b></span>
      </div>
      {data.source === "database" && (
        <dl className="grid gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
          <div><dt className="inline font-semibold">Terakhir diubah: </dt><dd className="inline">{data.updated_at ? new Date(data.updated_at).toLocaleString("id-ID") : "-"}</dd></div>
          <div><dt className="inline font-semibold">Tes terakhir: </dt>
            <dd className="inline">{data.last_test
              ? <span className={data.last_test.ok ? "text-emerald-700" : "text-risk-high"}>{data.last_test.ok ? "berhasil" : "gagal"} ({new Date(data.last_test.at).toLocaleString("id-ID")}){data.last_test.ok ? "" : `: ${data.last_test.message}`}</span>
              : "belum pernah dites, klik Tes koneksi"}</dd></div>
          <div className="sm:col-span-2"><dt className="inline font-semibold">Dipakai oleh: </dt><dd className="inline">AI Insight di detail objek, halaman Rekomendasi, dan Asisten AI. Skor risiko tetap dihitung kode, bukan LLM.</dd></div>
          <div className="sm:col-span-2"><dt className="inline font-semibold">Batas: </dt><dd className="inline">free tier Google dibatasi per menit/hari; bila habis, analisis gagal dengan pesan kuota (kode 429) dan bisa dicoba lagi nanti. Tiap hasil tetap berstatus DRAFT sampai ditinjau Reviewer.</dd></div>
        </dl>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Penyedia
          <Select className={selCls} value={provider} onValueChange={(v) => { setProvider(v); setModel(data.default_models[v]); }}>
            <option value="gemini">Google Gemini (ada free tier)</option>
            <option value="anthropic">Anthropic (berbayar)</option>
          </Select>
        </label>
        <label className="text-sm font-medium">Model
          <Select className={selCls} value={model} onValueChange={setModel}>
            {data.models[provider].map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </label>
        <div className="text-sm font-medium">API key
          {data.api_key_hint && !changeKey ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">••••••••{data.api_key_hint.replace("…", "")}</span>
              <button type="button" onClick={() => setChangeKey(true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Ganti key</button>
            </div>
          ) : (
            <input type="password" autoComplete="off" className={input} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === "gemini" ? "dari aistudio.google.com" : ""} />
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{active ? "Simpan perubahan" : "Simpan"}</button>
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
