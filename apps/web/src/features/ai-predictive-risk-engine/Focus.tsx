import Link from "next/link";
import { MapPin, Layers, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { api } from "@/lib/api-server";
import type { Analysis, CulturalObject, Risk } from "@/types/api";
import { Projection } from "./Projection";
import { simProb } from "./sim";

// Panel objek terpilih. Skor, faktor, confidence, insight = data nyata (baseline). Probabilitas & proyeksi = SIMULATED.
export async function Focus({ id, province }: { id: string; province: string }) {
  const [obj, risk, analyses] = await Promise.all([
    api<CulturalObject>(`/cultural-objects/${id}`),
    api<Risk>(`/cultural-objects/${id}/risk`),
    api<Analysis[]>(`/cultural-objects/${id}/analyses`),
  ]);
  const score = risk.risk_score;
  const insight = analyses.find((a) => a.analysis_type === "RISK_EXPLANATION") ?? analyses[0];
  const total = risk.factors.reduce((a, f) => a + f.contribution, 0) || 1;
  const factors = [...risk.factors].sort((a, b) => b.contribution - a.contribution).slice(0, 5);

  return (
    <div className="space-y-4">
      <Card bodyClassName="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="raw text-xl font-bold text-navy">{obj.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <RiskBadge level={risk.risk_level} />
            <span className="raw inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{province}</span>
            <span className="raw inline-flex items-center gap-1"><Layers size={14} aria-hidden />{obj.category}</span>
            {obj.data_origin === "SIMULATED" && <SimulatedBadge />}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-red-50 p-2.5"><p className="cap text-[11px] text-slate-600">Skor Risiko Saat Ini</p><p className="text-2xl font-bold text-risk-high">{score === null ? "—" : score.toFixed(0)}<span className="text-xs font-normal text-slate-500"> / 100</span></p></div>
          <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-gold" title="SIMULATED, bukan hasil model"><p className="cap text-[11px] text-slate-600">Probabilitas Risiko Tinggi</p><p className="text-2xl font-bold">{score === null ? "—" : `${simProb(score)}%`}</p><SimulatedBadge /></div>
          <div className="rounded-xl bg-green-50 p-2.5" title="Terpisah dari skor risiko"><p className="cap text-[11px] text-slate-600">Data Confidence</p><p className="text-2xl font-bold text-risk-low">{risk.data_confidence?.toFixed(2).replace(".", ",") ?? "—"}</p></div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <Card title="Proyeksi Skor Risiko" action={<SimulatedBadge />}>
          {score === null ? <p className="text-sm text-slate-600">Data belum cukup untuk menilai.</p> : <Projection score={score} year={+risk.period_end.slice(0, 4)} />}
          <p className="mt-2 text-xs text-slate-500">Hanya titik saat ini yang nyata. Garis proyeksi dan rentangnya karangan, model belum divalidasi.</p>
        </Card>
        <Card title="Faktor Penggerak Risiko" bodyClassName="space-y-2.5">
          {factors.length === 0 ? <p className="text-sm text-slate-600">Data belum cukup untuk menilai.</p> : factors.map((f) => {
            const pct = Math.round((f.contribution / total) * 100);
            return (
              <div key={f.indicator_code} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 text-sm">
                <span className="raw truncate" title={f.indicator_name}>{f.indicator_name}</span>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-risk-high" style={{ width: `${pct}%` }} /></div>
                <span className="w-9 text-right font-semibold">{pct}%</span>
              </div>
            );
          })}
          <p className="text-xs text-slate-500">Persen = porsi kontribusi tiap indikator pada skor baseline.</p>
        </Card>
      </div>

      <Card title="Insight & Rekomendasi AI" icon={Sparkles}>
        <p className="text-sm text-slate-700">{insight ? insight.output.summary : "Belum ada analisis AI untuk objek ini."}</p>
        <Link href={`/cultural-objects/${id}`} className="cap mt-3 inline-block rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-navy hover:brightness-95">Lihat Rekomendasi Lengkap</Link>
      </Card>
    </div>
  );
}
