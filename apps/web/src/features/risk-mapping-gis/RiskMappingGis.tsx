"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, AlertTriangle, Filter, Gauge, HelpCircle, Landmark, MapPin, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LEVEL_LABEL } from "@/features/map/levels";
import { Legend, RiskMap } from "@/features/map/RiskMap";
import type { MapLevel, ProvinceSummary, RiskLevelName } from "@/types/api";

type Obj = ProvinceSummary["objects"][number] & { province: string; pcode: string };
const LEVELS: RiskLevelName[] = ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"];
const BAR: Record<RiskLevelName, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low", INSUFFICIENT_DATA: "bg-risk-none" };
const sel = "raw mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold";
// Ambang level dari docs/risk-methodology.md (70/40); hanya untuk warna & label gauge
const scoreLevel = (s: number): RiskLevelName => (s >= 70 ? "HIGH" : s >= 40 ? "MEDIUM" : "LOW");
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

function Gauge_({ score }: { score: number | null }) {
  const color = score === null ? "#8a94a6" : { HIGH: "#d64545", MEDIUM: "#e8a317", LOW: "#2e9e5b", INSUFFICIENT_DATA: "#8a94a6" }[scoreLevel(score)];
  return (
    <svg viewBox="0 0 120 70" className="w-36" role="img" aria-label={`Skor risiko ${score ?? "belum ada"} dari 100`}>
      <path d="M10 60A50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" pathLength={100} />
      {score !== null && <path d="M10 60A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray={`${score} 100`} />}
      <text x="60" y="52" textAnchor="middle" className="fill-navy text-[26px] font-bold">{score !== null ? Math.round(score) : "—"}</text>
      <text x="60" y="66" textAnchor="middle" className="fill-slate-500 text-[9px]">/ 100</text>
    </svg>
  );
}

export function RiskMappingGis({ provinces, initial }: { provinces: ProvinceSummary[]; initial: string | null }) {
  const [prov, setProv] = useState<string | null>(initial && provinces.some((p) => p.code === initial) ? initial : null);
  const [cat, setCat] = useState("");
  const [lvl, setLvl] = useState<MapLevel | "ALL">("ALL");

  const all: Obj[] = provinces.flatMap((p) => p.objects.map((o) => ({ ...o, province: p.name, pcode: p.code })));
  const sp = provinces.find((p) => p.code === prov) ?? null;
  const scoped = all.filter((o) => (!prov || o.pcode === prov) && (!cat || o.category === cat));
  const rows = scoped.filter((o) => lvl === "ALL" || o.level === lvl).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const count = (l: RiskLevelName) => scoped.filter((o) => o.level === l).length;
  const score = avg(scoped.flatMap((o) => (o.score === null ? [] : [o.score])));
  const conf = avg(scoped.flatMap((o) => (o.confidence === null ? [] : [o.confidence])));
  const categories = [...new Set(all.map((o) => o.category))].sort();
  const scope = sp?.name ?? "Nasional";
  const top = scoped.filter((o) => o.level === "HIGH").sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
  const reset = () => { setProv(null); setCat(""); setLvl("ALL"); };

  const kpis = [
    { label: "Objek Budaya", value: scoped.length, icon: Landmark, cls: "text-navy-2 bg-blue-50" },
    { label: "Risiko Tinggi", value: count("HIGH"), icon: AlertTriangle, cls: "text-risk-high bg-red-50" },
    { label: "Risiko Sedang", value: count("MEDIUM"), icon: AlertCircle, cls: "text-risk-mid bg-amber-50" },
    { label: "Risiko Rendah", value: count("LOW"), icon: ShieldCheck, cls: "text-risk-low bg-green-50" },
    { label: "Data Kurang", value: count("INSUFFICIENT_DATA"), icon: HelpCircle, cls: "text-slate-600 bg-slate-100" },
    { label: "Provinsi Berobjek", value: provinces.filter((p) => p.n_objects > 0).length, icon: MapPin, cls: "text-purple-700 bg-purple-50" },
    { label: "Skor Rata-rata", value: score ?? "—", icon: Gauge, cls: "text-navy-2 bg-blue-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {kpis.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <span className={`rounded-xl p-2.5 ${cls}`}><Icon size={20} aria-hidden /></span>
            <div className="min-w-0"><p className="text-xl font-bold leading-none">{value}</p><p className="cap mt-1 truncate text-[11px] text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <div className="space-y-4">
          <Card title="Peta Risiko Nasional" icon={MapPin}>
            <RiskMap provinces={provinces} selected={prov} levelFilter={lvl} onSelect={(c) => setProv((p) => (p === c ? null : c))} height={460} />
            <div className="mt-3 space-y-1">
              <Legend />
              <p className="text-xs text-slate-500">Warna = skor rata-rata objek yang dinilai di provinsi itu (bisa menyembunyikan satu objek berisiko tinggi); tidak terpengaruh filter jenis. Batas provinsi 2017: pemekaran Papua digambar sebagai induknya. Klik provinsi lagi untuk melepas pilihan.</p>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] [&>*]:min-w-0">
            <Card title="Filter & Analisis" icon={Filter}>
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-navy">Jenis Budaya
                  <select value={cat} onChange={(e) => setCat(e.target.value)} className={sel}>
                    <option value="">Semua Jenis</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-navy">Provinsi
                  <select value={prov ?? ""} onChange={(e) => setProv(e.target.value || null)} className={sel}>
                    <option value="">Semua Provinsi</option>
                    {provinces.filter((p) => p.n_objects > 0).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-navy">Tingkat Risiko
                  <select value={lvl} onChange={(e) => setLvl(e.target.value as MapLevel | "ALL")} className={sel}>
                    <option value="ALL">Semua Risiko</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                  </select>
                </label>
                <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"><RotateCcw size={14} aria-hidden />Reset</button>
              </div>
            </Card>

            <Card title={`Daftar Objek Budaya (${scope})`} icon={Landmark} action={<span className="text-xs">{rows.length} objek</span>} className="overflow-hidden" bodyClassName="p-0">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs text-slate-500 shadow-[0_1px_0_#e2e8f0]">
                    <tr><th className="px-4 py-2">No</th><th>Objek Budaya</th><th>Jenis</th>{!prov && <th>Provinsi</th>}<th>Skor</th><th>Tingkat</th><th className="pr-4">Aksi</th></tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Tidak ada objek untuk filter ini.</td></tr>}
                    {rows.map((o, i) => (
                      <tr key={o.id} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        <td className="raw font-medium text-navy">{o.name}{o.is_simulated && <span className="ml-1.5 rounded bg-gold-soft px-1 text-[10px] font-bold text-amber-800 ring-1 ring-gold">SIM</span>}</td>
                        <td className="raw text-slate-600">{o.category}</td>
                        {!prov && <td className="raw text-slate-600">{o.province}</td>}
                        <td className="font-bold">{o.score !== null ? o.score.toFixed(0) : "—"}</td>
                        <td><RiskBadge level={o.level} /></td>
                        <td className="pr-4"><Link href={`/cultural-objects/${o.id}`} className="rounded-lg bg-gold px-3 py-1 text-xs font-semibold text-navy hover:brightness-95">Detail</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card title={`Detail Wilayah: ${scope}`} icon={MapPin}>
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="raw text-lg font-bold text-navy">{scope}</p>
                {sp && <span className="text-xs text-slate-500">Kode: {sp.code}</span>}
                {(sp ? sp.is_simulated : all.some((o) => o.is_simulated)) && <span className="rounded-md bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-gold">SIMULATED</span>}
              </div>
              {sp?.merged_note && <p className="text-xs text-slate-500">{sp.merged_note}</p>}
              <div className="grid grid-cols-4 gap-2 text-center">
                {([["Objek", scoped.length, "text-navy"], ["Tinggi", count("HIGH"), "text-risk-high"], ["Sedang", count("MEDIUM"), "text-risk-mid"], ["Rendah", count("LOW"), "text-risk-low"]] as const).map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-200"><p className={`text-xl font-bold ${c}`}>{v}</p><p className="cap text-[11px] text-slate-500">{l}</p></div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Gauge_ score={score} />
                  <p className="cap text-xs text-slate-500">Skor Risiko Wilayah</p>
                  {score !== null && <p className="text-sm font-bold">{LEVEL_LABEL[scoreLevel(score)]}</p>}
                </div>
                <ul className="flex-1 space-y-2">
                  {LEVELS.map((l) => {
                    const n = count(l), pct = scoped.length ? Math.round((n / scoped.length) * 100) : 0;
                    return (
                      <li key={l}>
                        <div className="flex justify-between text-xs"><span className="cap">{LEVEL_LABEL[l]}</span><span className="text-slate-600">{pct}% ({n})</span></div>
                        <div className="h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${BAR[l]}`} style={{ width: `${pct}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="text-xs text-slate-500">Data confidence rata-rata: <b className="text-navy">{conf ?? "—"}</b> (terpisah dari skor risiko).</p>
            </div>
          </Card>

          <Card title="Analisis Spasial" icon={Sparkles}>
            <div className="space-y-3 text-sm">
              <p className="rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-200">
                <b className="text-navy">Ringkasan otomatis (berbasis aturan, bukan AI): </b>
                {scoped.length === 0 ? "belum ada objek di wilayah ini." : <>di <span className="raw">{scope}</span>, {count("HIGH")} dari {scoped.length} objek berisiko tinggi{top.length > 0 ? ", prioritas: " : "."}{top.map((o, i) => <span key={o.id}>{i > 0 && ", "}<span className="raw">{o.name}</span> ({o.score?.toFixed(0)})</span>)}{top.length > 0 && "."}</>}
              </p>
              <Link href="/recommendations" className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:brightness-95">Lihat Rekomendasi Lengkap</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
