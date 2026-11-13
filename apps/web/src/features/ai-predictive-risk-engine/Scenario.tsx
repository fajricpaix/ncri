"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { LEVERS, simProb, withIntervention } from "./sim";

export function Scenario({ base }: { base: number }) {
  const [pct, setPct] = useState<Record<string, number>>(Object.fromEntries(LEVERS.map((l) => [l.key, l.init])));
  const [applied, setApplied] = useState(pct);
  const after = withIntervention(base, applied);
  const drop = base ? Math.round(((base - after) / base) * 100) : 0;
  return (
    <>
      <Card title="Simulasi Skenario Intervensi" action={<SimulatedBadge />} bodyClassName="flex flex-col justify-between gap-3">
        {LEVERS.map((l) => (
          <label key={l.key} className="block text-sm">
            <span className="cap flex justify-between"><span>{l.label}</span><span className="font-semibold">+{pct[l.key]}%</span></span>
            <input type="range" min={0} max={60} value={pct[l.key]} onChange={(e) => setPct({ ...pct, [l.key]: +e.target.value })} className="mt-1 w-full accent-[#e8a317]" />
          </label>
        ))}
        <p className="text-xs text-slate-500">Geser tiap tuas lalu tekan tombol. Bobot efek tiap tuas karangan (SIMULATED), bukan hasil model.</p>
        <button type="button" onClick={() => setApplied(pct)} className="flex w-full items-center justify-center gap-2 btn-gold px-4 py-2 text-sm font-semibold text-navy">
          <Play size={16} aria-hidden />Jalankan Simulasi
        </button>
      </Card>
      <Card title="Hasil Simulasi (Proyeksi 2028)" action={<SimulatedBadge />} bodyClassName="flex flex-col justify-between gap-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <Score label="Tanpa Intervensi" v={base} tone="red" />
          <span aria-hidden className="text-2xl font-bold text-risk-low">»</span>
          <Score label="Dengan Intervensi" v={after} tone="green" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-white px-3 py-1.5 ring-1 ring-green-200">
          <span className="text-2xl font-bold text-risk-low">▼ {drop}%</span>
          <span className="cap text-right text-xs text-slate-600">Penurunan Risiko<br />(Simulasi)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200"><p className="cap text-slate-500">Probabilitas Risiko Tinggi</p><p className="text-sm font-bold">{simProb(base)}% <span className="text-risk-low">→ {simProb(after)}%</span></p></div>
          <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200"><p className="cap text-slate-500">Tingkat Risiko</p><p className="text-sm font-bold">{lvl(base)} <span className="text-risk-low">→ {lvl(after)}</span></p></div>
        </div>
        <div>
          <p className="cap mb-1 text-xs font-semibold text-slate-500">Kontribusi Tiap Intervensi</p>
          <ul className="space-y-1.5 text-sm">
            {LEVERS.map((l) => {
              const pts = Math.round(base * l.w * (applied[l.key] ?? 0) / 100);
              return (
                <li key={l.key}>
                  <div className="flex justify-between"><span>{l.label}</span><span className="font-semibold text-risk-low">−{pts} poin</span></div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-risk-low" style={{ width: `${base - after ? Math.min(100, (pts / (base - after)) * 100) : 0}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
    </>
  );
}

// Ambang 70/40 = contoh demo (docs/risk-methodology.md), SIMULATED.
const lvl = (v: number) => (v >= 70 ? "Tinggi" : v >= 40 ? "Sedang" : "Rendah");

function Score({ label, v, tone }: { label: string; v: number; tone: "red" | "green" }) {
  const c = tone === "red" ? ["bg-red-50", "text-risk-high", "bg-risk-high"] : ["bg-green-50", "text-risk-low", "bg-risk-low"];
  return (
    <div className={`rounded-xl px-3 py-2 ${c[0]}`}>
      <p className={`cap text-xs font-semibold ${c[1]}`}>{label}</p>
      <p className={`text-3xl font-bold ${c[1]}`}>{v}</p>
      <div className="mt-1 h-1.5 rounded-full bg-white/80"><div className={`h-1.5 rounded-full ${c[2]}`} style={{ width: `${v}%` }} /></div>
    </div>
  );
}
