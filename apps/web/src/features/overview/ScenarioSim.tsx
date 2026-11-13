"use client";
import { useState } from "react";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";

const LV = [["HIGH", "Tinggi", "bg-risk-high"], ["MEDIUM", "Sedang", "bg-risk-mid"], ["LOW", "Rendah", "bg-risk-low"]] as const;
const level = (s: number) => (s >= 70 ? "HIGH" : s >= 40 ? "MEDIUM" : "LOW"); // ambang demo, sama dengan risk.py

// What-if sederhana: geser semua skor N poin lalu hitung ulang tingkat. BUKAN prediksi (model belum ada, lihat /analytics).
export function ScenarioSim({ scores }: { scores: number[] }) {
  const [shift, setShift] = useState(-10);
  const count = (d: number) => Object.fromEntries(LV.map(([k]) => [k, scores.filter((s) => level(Math.min(100, Math.max(0, s + d))) === k).length]));
  const base = count(0), sim = count(shift);
  return (
    <div className="space-y-4 text-sm">
      <p className="flex flex-wrap items-center gap-2"><SimulatedBadge /><span className="text-slate-600">Skenario karangan: semua skor objek yang tampil digeser sekian poin. Bukan prediksi.</span></p>
      <label className="block font-medium">
        Perubahan skor risiko: <b>{shift > 0 ? "+" : ""}{shift} poin</b>
        <input type="range" min={-30} max={30} value={shift} onChange={(e) => setShift(+e.target.value)} className="mt-2 block w-full max-w-md accent-navy" />
      </label>
      {scores.length === 0 ? <p className="text-slate-600">Tidak ada objek bernilai untuk disimulasikan.</p> : (
        <table className="w-full max-w-md text-left">
          <thead className="cap text-xs text-slate-500"><tr><th>Tingkat</th><th>Sekarang</th><th>Skenario</th><th>Selisih</th></tr></thead>
          <tbody>
            {LV.map(([k, label, cls]) => (
              <tr key={k} className="border-t border-slate-100">
                <td className="py-2"><span className={`mr-2 inline-block size-2.5 rounded-sm ${cls}`} aria-hidden />{label}</td>
                <td>{base[k]}</td><td>{sim[k]}</td>
                <td className={`font-semibold ${sim[k] === base[k] ? "text-slate-500" : (sim[k] < base[k]) === (k === "HIGH") ? "text-risk-low" : "text-risk-high"}`}>{sim[k] - base[k] > 0 ? "+" : ""}{sim[k] - base[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
