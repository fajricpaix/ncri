"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { LEVERS, withIntervention } from "./sim";

export function Scenario({ base }: { base: number }) {
  const [pct, setPct] = useState<Record<string, number>>(Object.fromEntries(LEVERS.map((l) => [l.key, l.init])));
  const [applied, setApplied] = useState(pct);
  const after = withIntervention(base, applied);
  const drop = base ? Math.round(((base - after) / base) * 100) : 0;
  return (
    <>
      <Card title="Simulasi Skenario Intervensi" action={<SimulatedBadge />} bodyClassName="space-y-4">
        {LEVERS.map((l) => (
          <label key={l.key} className="block text-sm">
            <span className="cap flex justify-between"><span>{l.label}</span><span className="font-semibold">+{pct[l.key]}%</span></span>
            <input type="range" min={0} max={60} value={pct[l.key]} onChange={(e) => setPct({ ...pct, [l.key]: +e.target.value })} className="mt-1 w-full accent-[#e8a317]" />
          </label>
        ))}
        <button type="button" onClick={() => setApplied(pct)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-navy hover:brightness-95">
          <Play size={16} aria-hidden />Jalankan Simulasi
        </button>
      </Card>
      <Card title="Hasil Simulasi (Proyeksi 2028)" action={<SimulatedBadge />} bodyClassName="flex flex-col justify-center gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <div className="rounded-xl bg-red-50 p-3"><p className="cap text-xs font-semibold text-risk-high">Tanpa Intervensi</p><p className="text-4xl font-bold text-risk-high">{base}</p></div>
          <span aria-hidden className="text-2xl font-bold text-risk-low">»</span>
          <div className="rounded-xl bg-green-50 p-3"><p className="cap text-xs font-semibold text-risk-low">Dengan Intervensi</p><p className="text-4xl font-bold text-risk-low">{after}</p></div>
        </div>
        <p className="text-center text-sm font-semibold text-risk-low">▼ {drop}% <span className="font-normal text-slate-600">(penurunan risiko, simulasi)</span></p>
      </Card>
    </>
  );
}
