import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RunRiskButton } from "@/features/overview/RunRiskButton";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { AiPanel } from "@/features/ai/AiPanel";
import { ObservationChart } from "@/features/cultural-repository/ObservationChart";
import { api, getMe, serverFetch } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { CulturalObject, Indicator, Analysis, Observation, Risk } from "@/types/api";

function RiskPanel({ risk }: { risk: Risk }) {
  const f2 = (n: number | null) => (n === null ? "—" : n.toFixed(2).replace(".", ","));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="cap text-xs text-slate-500">Skor risiko</p>
          <p className="text-3xl font-bold">{risk.risk_score === null ? "—" : risk.risk_score.toFixed(0)}<span className="text-base font-normal text-slate-500"> / 100</span></p>
        </div>
        <RiskBadge level={risk.risk_level} />
        <div title="Seberapa lengkap, mutakhir, dan terverifikasi bukti pendukung. Terpisah dari skor risiko.">
          <p className="cap text-xs text-slate-500">Data confidence</p>
          <p className="text-3xl font-bold">{f2(risk.data_confidence)}</p>
        </div>
        <p className="text-xs text-slate-500">
          Periode s.d. {risk.period_end} · metode {risk.method_version}
          {risk.is_simulated && " · berbasis data SIMULATED"}
        </p>
      </div>
      {risk.factors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2">Faktor</th><th>Perubahan</th><th>Risiko (0–100)</th><th>Bobot</th><th>Kontribusi</th></tr>
            </thead>
            <tbody>
              {risk.factors.map((f) => (
                <tr key={f.indicator_code} className="border-t border-slate-100">
                  <td className="py-2">{f.indicator_name}</td>
                  <td>{f.change_pct > 0 ? "+" : ""}{f.change_pct.toFixed(1)}%</td>
                  <td>{f.normalized_risk.toFixed(0)}</td>
                  <td>{(f.weight * 100).toFixed(0)}%</td>
                  <td className="font-semibold">{f.contribution.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Data belum cukup untuk menilai (butuh minimal 3 indikator dengan dua periode setara). Tidak ada klasifikasi yang dipaksakan.</p>
      )}
      <p className="text-xs text-slate-500">
        Komponen confidence: {Object.entries(risk.confidence_components).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(" · ")}
      </p>
    </div>
  );
}

async function Detail({ params }: { params: PageProps<"/cultural-repository/[id]">["params"] }) {
  const { id } = await params;
  const res = await serverFetch(`/cultural-objects/${id}`);
  if (res.status === 404 || res.status === 422) notFound();
  if (!res.ok) throw new Error(`API ${res.status}`);
  const obj: CulturalObject = await res.json();
  const [obs, inds] = await Promise.all([
    api<Observation[]>(`/cultural-objects/${id}/indicators`),
    api<Indicator[]>("/indicators"),
  ]);
  const riskRes = await serverFetch(`/cultural-objects/${id}/risk`);
  const risk: Risk | null = riskRes.ok ? await riskRes.json() : null;
  const analyses = await api<Analysis[]>(`/cultural-objects/${id}/analyses`);
  const me = await getMe();
  const name = new Map(inds.map((i) => [i.id, i.name]));
  const years = [...new Set(obs.map((o) => o.period_end.slice(0, 4)))].sort();
  const byInd = new Map<string, Map<string, number | null>>();
  for (const o of obs) {
    const m = byInd.get(o.indicator_id) ?? new Map();
    m.set(o.period_end.slice(0, 4), o.value_numeric);
    byInd.set(o.indicator_id, m);
  }
  const series = [...byInd].map(([iid, m]) => ({ name: name.get(iid) ?? iid, data: years.map((y) => m.get(y) ?? null) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="raw text-xl font-bold">{obj.name}</h2>
        <OriginBadge origin={obj.data_origin} />
        <span className="text-sm text-slate-500">{obj.category} · verifikasi: {obj.verification_status}</span>
        {can(me.role, "analyze") && (
          <Link href={`/cultural-repository/${id}/edit`} className="cap ml-auto rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-300 hover:bg-slate-50">Edit</Link>
        )}
      </div>
      {obj.description && <p className="max-w-3xl text-sm text-slate-700">{obj.description}</p>}
      <Card title="Penilaian Risiko" action={<RunRiskButton objectId={id} />}>
        {risk ? <RiskPanel risk={risk} /> : (
          <p className="text-sm text-slate-600">Belum ada penilaian. Klik “Hitung ulang risiko”. Objek dengan data kurang tetap berstatus INSUFFICIENT_DATA.</p>
        )}
      </Card>
      <Card title="AI Insight (draft)"><AiPanel objectId={id} analyses={analyses} /></Card>
      <Card title="Riwayat Indikator">
        {obs.length ? <ObservationChart years={years} series={series} /> : (
          <p className="text-sm text-slate-600">Belum ada observasi indikator. Import CSV di halaman Data Submission.</p>
        )}
      </Card>
      {obs.length > 0 && (
        <Card title="Data Observasi" className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2">Indikator</th><th>Periode</th><th>Nilai</th><th>Verifikasi</th><th>Asal</th></tr>
            </thead>
            <tbody>
              {obs.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="py-2">{name.get(o.indicator_id)}</td>
                  <td>{o.period_start} → {o.period_end}</td>
                  <td>{o.value_numeric ?? "—"}</td>
                  <td>{o.verification_status}</td>
                  <td><OriginBadge origin={o.data_origin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Link href="/cultural-repository" className="text-sm text-navy-2 hover:underline">← Kembali ke daftar</Link>
    </div>
  );
}

export default function Page(props: PageProps<"/cultural-repository/[id]">) {
  return (
    <Suspense fallback={<PageLoader label="Memuat…" />}>
      <Detail params={props.params} />
    </Suspense>
  );
}
