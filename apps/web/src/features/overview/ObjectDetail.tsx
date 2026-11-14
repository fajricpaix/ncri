import Link from "next/link";
import { ChevronRight, MapPin, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { ObjectThumb } from "@/features/ai-predictive-risk-engine/ObjectThumb";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { api } from "@/lib/api-server";
import type { Analysis, CulturalObject, Risk } from "@/types/api";


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

  const level = risk.risk_level;
  const TONE: Record<string, string> = { HIGH: "bg-red-50 ring-red-200 text-risk-high", MEDIUM: "bg-amber-50 ring-amber-200 text-amber-700", LOW: "bg-green-50 ring-green-200 text-risk-low", INSUFFICIENT_DATA: "bg-slate-100 ring-slate-200 text-slate-600" };
  const RANK = ["bg-risk-high", "bg-orange-500", "bg-risk-mid", "bg-yellow-400", "bg-risk-low"];
  const conf = risk.data_confidence === null ? null : Math.round(risk.data_confidence * 100);
  const sum = factors.reduce((a, f) => a + f.contribution, 0) || 1;
  const panel = "rounded-xl p-4 ring-1 ring-slate-200";

  return (
    <Card title="Detail Penilaian Risiko" className="h-full" bodyClassName="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 basis-80 items-center gap-4">
          <ObjectThumb name={obj.name} size={112} />
          <div className="min-w-0">
            <h3 className="raw text-2xl font-bold text-navy">{obj.name}</h3>
            <p className="raw mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-600">
              {obj.external_code && <span className="font-medium">{obj.external_code}</span>}
              <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{province}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="raw inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"><Layers size={12} aria-hidden />{obj.category}</span>
              <RiskBadge level={level} />
            </div>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-80">
          <div className={`rounded-xl p-3 ring-1 ${TONE[level]}`}>
            <p className="cap text-xs font-medium text-slate-700">Skor Risiko Saat Ini</p>
            <p className="mt-2 text-4xl font-bold leading-none">{score === null ? "—" : score.toFixed(0)}<span className="text-sm font-normal text-slate-500"> / 100</span></p>
          </div>
          <div className="rounded-xl bg-green-50 p-3 ring-1 ring-green-200" title="Kepercayaan terhadap kualitas data, terpisah dari skor risiko">
            <p className="cap text-xs font-medium text-slate-700">Tingkat Keyakinan (Confidence)</p>
            <p className="mt-2 flex items-center gap-1.5 text-4xl font-bold leading-none text-risk-low"><ShieldCheck size={22} aria-hidden />{conf === null ? "—" : `${conf}%`}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panel}>
          <h4 className="mb-3 text-sm font-bold text-navy">Faktor Penggerak Risiko</h4>
          {factors.length === 0 ? <p className="text-sm text-slate-600">Data belum cukup untuk menilai.</p> : (
            <ul className="space-y-3">
              {factors.map((f, i) => (
                <li key={f.indicator_code} className="text-sm">
                  <div className="flex justify-between gap-2"><span className="raw truncate" title={f.indicator_name}>{f.indicator_name}</span><b>{Math.round((f.contribution / sum) * 100)}%</b></div>
                  <div className="mt-1 h-2.5 rounded-full bg-slate-100"><div className={`h-2.5 rounded-full ${RANK[i] ?? "bg-risk-low"}`} style={{ width: `${(f.contribution / maxC) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={`${panel} flex flex-col bg-blue-50/50`}>
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-navy"><Sparkles size={15} className="text-gold" aria-hidden />Insight &amp; Rekomendasi AI</h4>
          <p className="mt-2 text-sm text-slate-700">{insight ? insight.output.summary : "Belum ada analisis AI untuk objek ini."}</p>
          {insight && <p className="mt-1 text-xs text-slate-500">Status: {insight.review_status === "APPROVED" ? "disetujui reviewer" : insight.review_status === "REJECTED" ? "ditolak reviewer" : "draft, belum ditinjau"}</p>}
          <Link href={`/cultural-repository/${id}`} className="cap btn-gold mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-navy">Lihat Rekomendasi Lengkap <ChevronRight size={16} aria-hidden /></Link>
        </section>
      </div>
    </Card>
  );
}
