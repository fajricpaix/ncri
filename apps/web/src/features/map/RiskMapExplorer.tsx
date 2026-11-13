"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { MapLevel, ProvinceSummary } from "@/types/api";
import { LEVEL_LABEL } from "./levels";
import { Legend, RiskMap } from "./RiskMap";

const FILTERS: (MapLevel | "ALL")[] = ["ALL", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA", "NO_DATA"];

export function RiskMapExplorer({ provinces, initial }: { provinces: ProvinceSummary[]; initial: string | null }) {
  const [selected, setSelected] = useState<string | null>(initial);
  const [filter, setFilter] = useState<MapLevel | "ALL">("ALL");
  const sel = provinces.find((p) => p.code === selected) ?? null;
  const rows = provinces.filter((p) => filter === "ALL" || p.level === filter);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Peta Risiko Provinsi" className="lg:col-span-2"
          action={
            <label className="text-xs">
              <span className="sr-only">Filter tingkat risiko</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value as MapLevel | "ALL")}
                className="rounded-md bg-white/10 px-2 py-1 text-white">
                {FILTERS.map((f) => <option key={f} value={f} className="text-black">{f === "ALL" ? "Semua Tingkat" : LEVEL_LABEL[f]}</option>)}
              </select>
            </label>
          }>
          <RiskMap provinces={provinces} selected={selected} levelFilter={filter} onSelect={setSelected} height={440} />
          <div className="mt-3 space-y-1">
            <Legend />
            <p className="text-xs text-slate-500">Warna = skor rata-rata objek yang berhasil dinilai di provinsi itu (rata-rata bisa menyembunyikan satu objek berisiko tinggi; lihat rincian di samping). Batas provinsi 2017: Papua Selatan, Tengah, dan Pegunungan tergambar sebagai Papua, Papua Barat Daya sebagai Papua Barat.</p>
          </div>
        </Card>
        <Card title={sel ? `Detail: ${sel.name}` : "Detail Provinsi"}>
          {!sel ? <p className="text-sm text-slate-600">Klik provinsi pada peta atau pilih dari tabel.</p> : (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {sel.level === "NO_DATA" ? <span className="text-slate-600">Belum ada objek terdaftar</span> : <RiskBadge level={sel.level as never} />}
                {sel.is_simulated && <span className="rounded-md bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-gold">SIMULATED</span>}
              </div>
              {sel.merged_note && <p className="text-xs text-slate-500">{sel.merged_note}</p>}
              <dl className="grid grid-cols-2 gap-2">
                <div><dt className="text-xs text-slate-500">Objek</dt><dd className="font-semibold">{sel.n_objects} ({sel.assessed} dinilai)</dd></div>
                <div><dt className="text-xs text-slate-500">Skor rata-rata</dt><dd className="font-semibold">{sel.avg_score ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Tinggi / Sedang / Rendah</dt><dd className="font-semibold">{sel.distribution.HIGH} / {sel.distribution.MEDIUM} / {sel.distribution.LOW}</dd></div>
                <div><dt className="text-xs text-slate-500">Data confidence</dt><dd className="font-semibold">{sel.avg_confidence ?? "—"}</dd></div>
              </dl>
              {sel.objects.length > 0 && (
                <ul className="divide-y divide-slate-100">
                  {sel.objects.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/cultural-objects/${o.id}`} className="font-medium normal-case text-navy-2 hover:underline">{o.name}</Link>
                      <span className="flex items-center gap-2">{o.score !== null && <b>{o.score.toFixed(0)}</b>}<RiskBadge level={o.level} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card title="Tabel Provinsi" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Provinsi</th><th>Objek</th><th>Skor rata-rata</th><th>Tingkat</th><th>T / S / R</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.code} className={`border-t border-slate-100 ${p.code === selected ? "bg-gold-soft/40" : ""}`}>
                <td className="py-2"><button onClick={() => setSelected(p.code)} className="font-medium normal-case text-navy-2 hover:underline">{p.name}</button></td>
                <td>{p.n_objects}</td>
                <td>{p.avg_score ?? "—"}</td>
                <td>{p.level === "NO_DATA" ? <span className="text-xs text-slate-500">Tidak ada objek</span> : <RiskBadge level={p.level as never} />}</td>
                <td className="text-slate-600">{p.distribution.HIGH} / {p.distribution.MEDIUM} / {p.distribution.LOW}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
