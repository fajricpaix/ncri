import Link from "next/link";
import { MapPin, Layers, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { api } from "@/lib/api-server";
import type { Analysis, CulturalObject, Risk } from "@/types/api";

// Panel objek terpilih. Skor, faktor, confidence, insight = data nyata (baseline). Probabilitas dan proyeksi belum ada (model belum divalidasi).
export async function Focus({ id, province, wide = false }: { id: string; province: string; wide?: boolean }) {
  const [obj, risk, analyses] = await Promise.all([
    api<CulturalObject>(`/cultural-objects/${id}`),
    api<Risk>(`/cultural-objects/${id}/risk`),
    api<Analysis[]>(`/cultural-objects/${id}/analyses`),
  ]);
  const score = risk.risk_score;
  const insight = analyses.find((a) => a.analysis_type === "RISK_EXPLANATION") ?? analyses[0];
  const total = risk.factors.reduce((a, f) => a + f.contribution, 0) || 1;
  const factors = [...risk.factors].sort((a, b) => b.contribution - a.contribution).slice(0, 5);

  // Fragment: 2 item grid (panel objek, faktor). Induk menaruhnya di grid 4 kolom.
  return (
    <>
      <div className={`flex flex-col gap-4 ${wide ? "xl:col-span-4 xl:grid xl:grid-cols-2 xl:items-start" : ""}`}>
      <Card bodyClassName="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="raw text-xl font-bold text-navy">{obj.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <RiskBadge level={risk.risk_level} />
            <span className="raw inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{province}</span>
            <span className="raw inline-flex items-center gap-1"><Layers size={14} aria-hidden />{obj.category}</span>
          </div>
        </div>
        <div className={`grid gap-2 ${wide ? "grid-cols-2 text-center" : "w-full"}`}>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2"><p className="cap text-xs text-slate-600">Skor Risiko Saat Ini</p><p className="text-2xl font-bold text-risk-high">{score === null ? "—" : score.toFixed(0)}<span className="text-xs font-normal text-slate-500"> / 100</span></p></div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-green-50 px-3 py-2" title="Terpisah dari skor risiko"><p className="cap text-xs text-slate-600">Data Confidence</p><p className="text-2xl font-bold text-risk-low">{risk.data_confidence?.toFixed(2).replace(".", ",") ?? "—"}</p></div>
        </div>
      </Card>
        <Card title="Faktor Penggerak Risiko" bodyClassName="flex flex-col gap-2">
          {factors.length === 0 ? <p className="text-sm text-slate-600">Data belum cukup untuk menilai.</p> : factors.map((f) => {
            const pct = Math.round((f.contribution / total) * 100);
            return (
              <div key={f.indicator_code} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="raw min-w-0 flex-1 truncate font-semibold text-navy" title={f.indicator_name}>{f.indicator_name}</span>
                  <span className="shrink-0 rounded bg-red-50 px-1.5 text-xs font-semibold text-risk-high" title="Perubahan dari periode sebelumnya">{f.change_pct > 0 ? "+" : "−"}{Math.abs(f.change_pct).toFixed(0)}%</span>
                  <span className="w-9 shrink-0 text-right font-bold">{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-risk-high" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          <p className="text-xs text-slate-500">Persen hitam = porsi pada skor baseline; chip merah = perubahan dari periode sebelumnya.</p>
        </Card>
      </div>
      <Card title="Insight & Rekomendasi AI" icon={Sparkles} className="xl:col-span-4">
        <p className="max-w-4xl text-sm leading-relaxed text-slate-700">{insight ? insight.output.summary : "Belum ada analisis AI untuk objek ini."}</p>
        <Link href={`/cultural-repository/${id}`} className="cap mt-3 inline-block btn-gold px-3 py-1.5 text-sm font-semibold text-navy">Lihat Rekomendasi Lengkap</Link>
      </Card>
    </>
  );
}
