"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCan } from "@/lib/user-context";
import type { AiSubmission, Region } from "@/types/api";

const safeUrl = (u: string) => {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:" ? x.href : null; } catch { return null; }
};

const NATIONAL_QUERY = "objek warisan budaya takbenda (tari, musik, kerajinan, tradisi lisan, dll) beserta jumlah pelaku, penerus, dan kegiatannya";

async function errText(r: Response) {
  const d = await r.json().catch(() => ({}));
  return typeof d.detail === "string" ? d.detail : `Error ${r.status}`;
}

/** Cari data dengan AI -> staging. Data baru tampil di dashboard hanya setelah Reviewer/Admin menyetujui. */
export function AiDiscovery() {
  const canSearch = useCan("analyze");
  const canReview = useCan("review");
  const [regions, setRegions] = useState<Region[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [items, setItems] = useState<AiSubmission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const [edit, setEdit] = useState<{ id: string; payload: Record<string, string | number | null> } | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch("/submissions?status=PENDING");
    if (r.ok) setItems(await r.json());
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat data awal dari API
    load();
    apiFetch("/regions?level=PROVINCE").then((r) => (r.ok ? r.json() : [])).then(setRegions).catch(() => {});
  }, [load]);

  const [nat, setNat] = useState<{ done: number; total: number; created: number; failed: number; dropped: number; empty: number } | null>(null);
  const [confirmNat, setConfirmNat] = useState(false);
  const stop = useRef(false);

  /** Satu klik = satu pencarian per provinsi, berurutan (hormati rate limit & kuota). Berhenti bila 3 galat beruntun. */
  async function searchNational() {
    setConfirmNat(false); setMsg(null); setDropped([]); stop.current = false; setBusy("national");
    const st = { done: 0, total: regions.length, created: 0, failed: 0, dropped: 0, empty: 0 };
    let streak = 0, lastErr = "";
    setNat({ ...st });
    for (const r of regions) {
      if (stop.current || streak >= 3) break;
      try {
        const res = await apiFetch("/llm/discovery", { method: "POST", body: JSON.stringify({ query: NATIONAL_QUERY, region_code: r.code }) });
        if (!res.ok) throw new Error(await errText(res));
        const d = (await res.json()) as { created: unknown[]; dropped: unknown[]; no_evidence?: boolean };
        st.created += d.created.length; st.dropped += d.dropped.length; st.empty += d.no_evidence ? 1 : 0; streak = 0;
      } catch (e) {
        st.failed++; streak++; lastErr = e instanceof Error ? e.message : "Gagal terhubung ke API";
      }
      st.done++;
      setNat({ ...st });
      await load();
    }
    const halted = streak >= 3;
    setMsg({ ok: !halted, text: `${stop.current ? "Dihentikan" : halted ? `Berhenti (3 galat beruntun: ${lastErr})` : "Selesai"}: ${st.done}/${st.total} provinsi, ${st.created} kandidat masuk antrean verifikasi, ${st.dropped} ditolak otomatis, ${st.empty} provinsi tanpa hasil bersumber, ${st.failed} galat.` });
    setNat(null); setBusy(null);
  }

  const regionName = (code: unknown) => regions.find((x) => x.code === code)?.name ?? String(code);

  async function search() {
    setBusy("search"); setMsg(null); setDropped([]);
    try {
      const r = await apiFetch("/llm/discovery", { method: "POST", body: JSON.stringify({ query, region_code: region || null }) });
      if (!r.ok) throw new Error(await errText(r));
      const d: { created: AiSubmission[]; dropped: string[] } = await r.json();
      setDropped(d.dropped);
      setMsg({ ok: true, text: `${d.created.length} kandidat masuk antrean verifikasi, ${d.dropped.length} ditolak otomatis.` });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Gagal terhubung ke API" });
    } finally { setBusy(null); }
  }

  async function decide(it: AiSubmission, action: "approve" | "reject") {
    setBusy(it.id); setMsg(null);
    try {
      const body = action === "approve" && edit?.id === it.id ? { payload: edit.payload } : {};
      const r = await apiFetch(`/submissions/${it.id}/${action}`, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await errText(r));
      setEdit(null);
      if (action === "approve") setMsg({ ok: true, text: "Disetujui. Klik Hitung Ulang Risiko agar skor ikut diperbarui." });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Gagal" });
    } finally { setBusy(null); }
  }

  const field = (it: AiSubmission, key: string, type: "text" | "number" = "text") => (
    <input type={type} aria-label={key} value={String(edit?.payload[key] ?? "")}
      onChange={(e) => setEdit({ id: it.id, payload: { ...edit!.payload, [key]: type === "number" ? Number(e.target.value) : e.target.value } })}
      className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
  );

  return (
    <div className="space-y-4">
      {canSearch ? (
        <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex flex-wrap items-center gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Contoh: Wayang Kulit, jumlah dalang"
            aria-label="Topik pencarian" minLength={3} maxLength={200} required
            className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Provinsi"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Semua Provinsi</option>
            {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
          <button disabled={busy !== null || query.trim().length < 3} className="btn-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">
            {busy === "search" ? "Mencari…" : "Cari Dengan AI"}
          </button>
        </form>
      ) : <p className="text-sm text-slate-600">Pencarian AI hanya untuk Analyst/Admin.</p>}
      {canSearch && (
        <div className="flex flex-wrap items-center gap-3">
          {busy === "national" ? (
            <>
              <span role="status" className="text-sm">Mencari {nat?.done ?? 0}/{nat?.total ?? 0} provinsi… ({nat?.created ?? 0} kandidat)</span>
              <button onClick={() => { stop.current = true; }} className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Berhenti</button>
            </>
          ) : confirmNat ? (
            <>
              <span className="text-sm">Ini menjalankan {regions.length} pencarian AI (memakai kuota LLM). Lanjut?</span>
              <button onClick={searchNational} className="btn-gold px-4 py-2 text-sm font-semibold text-navy">Ya, Cari</button>
              <button onClick={() => setConfirmNat(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Batal</button>
            </>
          ) : (
            <button disabled={busy !== null || regions.length === 0} onClick={() => setConfirmNat(true)}
              className="btn-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">Cari Data Se-Indonesia</button>
          )}
        </div>
      )}
      <p className="text-xs text-slate-500">Hasil AI masuk antrean dan baru tampil di dashboard setelah diverifikasi Reviewer/Admin.</p>

      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-slate-700" : "text-risk-high"}`}>{msg.text}</p>}
      {dropped.length > 0 && (
        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer">Ditolak otomatis ({dropped.length})</summary>
          <ul className="mt-1 list-disc pl-5">{dropped.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </details>
      )}

      <h3 className="text-sm font-bold">Menunggu Verifikasi ({items.length})</h3>
      {items.length === 0 && <p className="text-sm text-slate-600">Tidak ada data yang menunggu verifikasi.</p>}
      <ul className="space-y-3">
        {items.map((it) => {
          const p = it.payload, editing = edit?.id === it.id;
          return (
            <li key={it.id} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold">{it.kind === "OBJECT" ? "OBJEK" : "OBSERVASI"}</span>
                {it.kind === "OBJECT" ? (
                  editing ? <>{field(it, "name")}{field(it, "category")}</> :
                    <span className="raw font-semibold">{p.name} <span className="font-normal text-slate-500">· {p.category}</span></span>
                ) : (
                  <span className="raw font-semibold">{p.object_name} · {p.indicator_code} ·{" "}
                    {editing ? field(it, "value_numeric", "number") : p.value_numeric}
                    <span className="font-normal text-slate-500"> ({p.period_start} s.d. {p.period_end})</span></span>
                )}
                <span className="text-slate-500">{regionName(p.region_code)}</span>
              </div>
              {it.kind === "OBJECT" && p.description && <p className="raw text-slate-600">{p.description}</p>}
              <blockquote className="raw border-l-2 border-slate-300 pl-3 text-slate-600">“{it.evidence_text}”</blockquote>
              <p className="text-xs text-slate-500">
                Sumber:{" "}
                {it.sources.map((s, i) => {
                  const href = safeUrl(s.url);
                  return href
                    ? <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="raw mr-2 text-navy-2 underline">{s.title || href}</a>
                    : <span key={i} className="raw mr-2">{s.title || s.url}</span>;
                })}
                · {it.provider}/{it.model}
              </p>
              {canReview ? (
                <div className="flex gap-2">
                  <button disabled={busy !== null} onClick={() => decide(it, "approve")} className="rounded-md bg-risk-low px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Setujui</button>
                  <button disabled={busy !== null} onClick={() => decide(it, "reject")} className="rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ring-slate-300 disabled:opacity-50">Tolak</button>
                  <button disabled={busy !== null} onClick={() => setEdit(editing ? null : { id: it.id, payload: { ...p } })} className="rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ring-slate-300">{editing ? "Batal Edit" : "Edit"}</button>
                </div>
              ) : <span className="text-xs text-slate-400">menunggu Reviewer</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
