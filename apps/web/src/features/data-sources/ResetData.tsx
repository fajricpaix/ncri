"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API, apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";

const CONFIRM = "KOSONGKAN DATA";

/** Reset data transaksi (hanya Admin). Pengguna, wilayah, indikator, pengaturan, dan audit log tetap. */
export function ResetData() {
  const router = useRouter();
  const isAdmin = useCan("admin");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!isAdmin) return <p className="text-sm text-slate-600">Kosongkan data hanya untuk Admin.</p>;

  async function run() {
    setBusy(true); setMsg(null);
    try {
      const r = await apiFetch("/admin/reset-data", { method: "POST", body: JSON.stringify({ confirm: text }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : `Error ${r.status}`);
      const n = (Object.values(d.deleted) as number[]).reduce((a, b) => a + b, 0);
      setMsg({ ok: true, text: `Selesai: ${n} baris dihapus. Silakan upload ulang data.` });
      setOpen(false); setText("");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Gagal terhubung ke API" });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Menghapus semua data objek, observasi, sumber, penilaian risiko, early warning, analisis AI, rekomendasi, dan antrean verifikasi, supaya bisa upload ulang dari awal. Akun, wilayah, indikator, pengaturan, dan audit log tidak ikut terhapus.</p>
      {!open ? (
        <button onClick={() => { setOpen(true); setMsg(null); }} className="rounded-lg bg-risk-high px-4 py-2 text-sm font-semibold text-white">Kosongkan Semua Data</button>
      ) : (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-semibold text-risk-high">Tindakan ini tidak bisa dibatalkan.</p>
          <p>Simpan cadangan dulu:{" "}
            <a href={`${API}/reports/objects.csv`} className="text-navy-2 underline">unduh objek (CSV)</a>{" · "}
            <a href={`${API}/reports/early-warnings.csv`} className="text-navy-2 underline">unduh early warning (CSV)</a>.
          </p>
          <label className="block">Ketik <b>{CONFIRM}</b> untuk melanjutkan:
            <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off"
              className="mt-1 block w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2" />
          </label>
          <div className="flex gap-2">
            <button disabled={busy || text !== CONFIRM} onClick={run} className="rounded-lg bg-risk-high px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Menghapus…" : "Hapus Semua Data"}</button>
            <button disabled={busy} onClick={() => { setOpen(false); setText(""); }} className="rounded-lg px-4 py-2 font-semibold ring-1 ring-slate-300">Batal</button>
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-slate-700" : "text-risk-high"}`}>{msg.text}</p>}
    </div>
  );
}
