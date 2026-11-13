import Link from "next/link";
import { MapPin, Layers, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { api } from "@/lib/api-server";
import type { Analysis, CulturalObject, Risk } from "@/types/api";

const BAR: Record<string, string> = { HIGH: "bg-risk-high", MEDIUM: "bg-risk-mid", LOW: "bg-risk-low" };

export async function ObjectDetail({ id, province }: { id: string; province: string }) {
  const [obj, risk, analyses] = await Promise.all([
    api<CulturalObject>(`/cultural-objects/${id}`),
    api<Risk>(`/cultural-objects/${id}/risk`),
    api<Analysis[]>(`/cultural-objects/${id}/analyses`),
  ]);
  const score = risk.risk_score;
  const insight = analyses.find((a) => a.analysis_type === "RISK_EXPLANATION") ?? analyses[0];
  // Komposisi = kontribusi tiap faktor ke skor, diurutkan terbesar.
  const factors = [...risk.factors].sort((a, b) => b.contribution - a.contribution).slice(0, 5);
  const maxC = Math.max(...factors.map((f) => f.contribution), 1);

  return (
    <Card title="Detail Penilaian Risiko" className="h-full" bodyClassName="space-y-4">
      <div>
        <h3 className="raw text-xl font-bold text-navy">{obj.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <RiskBadge level={risk.risk_level} />
          <span className="raw inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{province}</span>
          <span className="raw inline-flex items-center gap-1"><Layers size={14} aria-hidden />{obj.category}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="cap text-xs text-slate-500">Skor Risiko</p>
          <p className="text-3xl font-bold">{score === null ? "—" : score.toFixed(0)}<span className="text-base font-normal text-slate-500"> / 100</span></p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200" title="Terpisah dari skor risiko">
          <p className="cap text-xs text-slate-500">Data Confidence</p>
          <p className="text-3xl font-bold">{risk.data_confidence?.toFixed(2).replace(".", ",") ?? "—"}</p>
        </div>
      </div>
      {score !== null && (
        <div role="img" aria-label={`Skor ${score.toFixed(0)} dari 100`}>
          <div className="relative h-2 rounded-full bg-gradient-to-r from-risk-low via-risk-mid to-risk-high">
            <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-navy shadow" style={{ left: `${Math.min(score, 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500"><span>Rendah</span><span>Sedang</span><span>Tinggi</span></div>
        </div>
      )}
      <section>
        <h4 className="mb-2 text-sm font-bold text-navy">Komposisi Penilaian Risiko</h4>
        {factors.length === 0 ? <p className="text-sm text-slate-600">Data belum cukup untuk menilai.</p> : (
          <ul className="space-y-2">
            {factors.map((f) => (
              <li key={f.indicator_code} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 text-sm">
                <span className="raw truncate" title={f.indicator_name}>{f.indicator_name}</span>
                <div className="h-2.5 rounded-full bg-slate-100"><div className={`h-2.5 rounded-full ${BAR[risk.risk_level] ?? "bg-gold"}`} style={{ width: `${(f.contribution / maxC) * 100}%` }} /></div>
                <span className="w-10 text-right font-semibold">{f.contribution.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl bg-blue-50/60 p-3 ring-1 ring-blue-100">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-navy"><Sparkles size={15} className="text-gold" aria-hidden />Insight &amp; Rekomendasi AI</h4>
        <p className="mt-1.5 text-sm text-slate-700">{insight ? insight.output.summary : "Belum ada analisis AI untuk objek ini."}</p>
        {insight && <p className="mt-1 text-xs text-slate-500">Status: {insight.review_status === "APPROVED" ? "disetujui reviewer" : insight.review_status === "REJECTED" ? "ditolak reviewer" : "draft, belum ditinjau"}</p>}
        <Link href={`/cultural-objects/${id}`} className="cap mt-2 inline-block rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-navy hover:brightness-95">Lihat Rekomendasi</Link>
      </section>
    </Card>
  );
}
