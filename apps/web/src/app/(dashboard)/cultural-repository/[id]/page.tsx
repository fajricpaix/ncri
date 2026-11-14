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
import { Activity, Database, Gauge, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { ObjectThumb } from "@/features/ai-predictive-risk-engine/ObjectThumb";
import type { Analysis, CulturalObject, DataSource, Indicator, Observation, Region, Risk, RiskLevelName } from "@/types/api";

const f2 = (n: number | null) => (n === null ? "—" : n.toFixed(2).replace(".", ","));
const LEVEL_TONE: Record<RiskLevelName, "red" | "amber" | "green" | "slate"> = { HIGH: "red", MEDIUM: "amber", LOW: "green", INSUFFICIENT_DATA: "slate" };
const CONF_LABEL: Record<string, string> = { sources: "Jumlah Sumber", freshness: "Kemutakhiran", completeness: "Kelengkapan", verification: "Terverifikasi" };
const VERIF: Record<string, string> = { UNVERIFIED: "Belum Diverifikasi", VERIFIED: "Terverifikasi", PENDING: "Menunggu" };
const verif = (v: string) => VERIF[v] ?? v;

// Faktor risiko: bar kontribusi (bukan tabel), lebih cepat dibaca. Teks perubahan memakai tanda + warna + ikon.
function Factors({ risk }: { risk: Risk }) {
  const max = Math.max(...risk.factors.map((f) => f.contribution), 1);
  return (
    <ul className="space-y-4">
      {risk.factors.map((f) => (
        <li key={f.indicator_code}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="raw text-sm font-medium text-navy">{f.indicator_name}</span>
            <span className="text-sm font-bold text-navy">{f.contribution.toFixed(1)} <span className="text-xs font-normal text-slate-500">poin</span></span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(f.contribution / max) * 100}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-slate-500">
            <span className={`inline-flex items-center gap-1 font-medium ${f.change_pct < 0 ? "text-risk-high" : "text-risk-low"}`}>
              {f.change_pct < 0 ? <TrendingDown size={13} aria-hidden /> : <TrendingUp size={13} aria-hidden />}
              {f.change_pct > 0 ? "+" : ""}{f.change_pct.toFixed(1)}%
            </span>
            <span>Risiko {f.normalized_risk.toFixed(0)}/100</span>
            <span>Bobot {(f.weight * 100).toFixed(0)}%</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function Confidence({ comps }: { comps: Record<string, number> }) {
  return (
    <ul className="space-y-3">
      {Object.entries(comps).map(([k, v]) => (
        <li key={k}>
          <div className="flex justify-between text-sm"><span className="cap text-slate-600">{CONF_LABEL[k] ?? k}</span><span className="font-semibold text-navy">{f2(v)}</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy-2" style={{ width: `${Math.min(100, v * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="cap text-xs text-slate-500">{label}</dt><dd className="raw mt-0.5 text-sm font-medium text-navy">{children}</dd></div>;
}

async function Detail({ params }: { params: PageProps<"/cultural-repository/[id]">["params"] }) {
  const { id } = await params;
  const res = await serverFetch(`/cultural-objects/${id}`);
  if (res.status === 404 || res.status === 422) notFound();
  if (!res.ok) throw new Error(`API ${res.status}`);
  const obj: CulturalObject = await res.json();
  const [obs, inds, regions, sources, analyses, me, riskRes] = await Promise.all([
    api<Observation[]>(`/cultural-objects/${id}/indicators`),
    api<Indicator[]>("/indicators"),
    api<Region[]>("/regions"),
    api<DataSource[]>("/data-sources"),
    api<Analysis[]>(`/cultural-objects/${id}/analyses`),
    getMe(),
    serverFetch(`/cultural-objects/${id}/risk`),
  ]);
  const risk: Risk | null = riskRes.ok ? await riskRes.json() : null;
  const region = regions.find((r) => r.id === obj.region_id)?.name;
  const source = sources.find((x) => x.id === obj.source_id)?.name;
  const name = new Map(inds.map((i) => [i.id, i.name]));
  const years = [...new Set(obs.map((o) => o.period_end.slice(0, 4)))].sort();
  const byInd = new Map<string, Map<string, number | null>>();
  for (const o of obs) {
    const m = byInd.get(o.indicator_id) ?? new Map();
    m.set(o.period_end.slice(0, 4), o.value_numeric);
    byInd.set(o.indicator_id, m);
  }
  const series = [...byInd].map(([iid, m]) => ({ name: name.get(iid) ?? iid, data: years.map((y) => m.get(y) ?? null) }));
  const scored = risk?.risk_score !== null && risk?.risk_score !== undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/cultural-repository" className="text-sm text-navy-2 hover:underline">← Kembali ke daftar</Link>
        {can(me.role, "analyze") && (
          <Link href={`/cultural-repository/${id}/edit`} className="cap rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-navy shadow-sm ring-1 ring-slate-300 hover:bg-slate-50">Edit</Link>
        )}
      </div>

      <section className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:p-6">
        <ObjectThumb name={obj.name} size={112} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="raw text-2xl font-bold text-navy">{obj.name}</h2>
            <OriginBadge origin={obj.data_origin} />
          </div>
          {obj.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">{obj.description}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-5">
            <Meta label="Jenis">{obj.category}</Meta>
            <Meta label="Provinsi">{region ?? "—"}</Meta>
            <Meta label="Verifikasi">{verif(obj.verification_status)}</Meta>
            <Meta label="Sumber">{source ?? "—"}</Meta>
            <Meta label="Koordinat">{obj.latitude !== null && obj.longitude !== null ? `${obj.latitude.toFixed(3)}, ${obj.longitude.toFixed(3)}` : "—"}</Meta>
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Gauge} tone={risk ? LEVEL_TONE[risk.risk_level] : "slate"} label="Skor Risiko" value={scored ? risk!.risk_score!.toFixed(0) : "—"} emptyNote={scored ? undefined : "Belum Dinilai"}
          foot={risk && <RiskBadge level={risk.risk_level} />} />
        <StatCard icon={ShieldCheck} tone="blue" label="Data Confidence" value={f2(risk?.data_confidence ?? null)} emptyNote={risk ? undefined : "Belum Ada"} />
        <StatCard icon={Database} tone="purple" label="Observasi" value={obs.length} emptyNote={obs.length ? undefined : "Belum Ada"} foot={obs.length > 0 && <span className="text-xs text-slate-500">{years[0]}–{years[years.length - 1]}</span>} />
        <StatCard icon={Activity} tone="amber" label="Indikator" value={byInd.size} emptyNote={byInd.size ? undefined : "Belum Ada"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3 [&>*]:min-w-0">
        <Card title="Faktor Penyumbang Risiko" className="xl:col-span-2" action={<RunRiskButton objectId={id} />}>
          {risk && risk.factors.length > 0 ? (
            <>
              <p className="mb-4 text-xs text-slate-500">Diurutkan dari kontribusi terbesar · periode s.d. {risk.period_end} · metode {risk.method_version}</p>
              <Factors risk={{ ...risk, factors: [...risk.factors].sort((x, y) => y.contribution - x.contribution) }} />
            </>
          ) : (
            <p className="text-sm text-slate-600">{risk
              ? "Data belum cukup untuk menilai (butuh minimal 3 indikator dengan dua periode setara). Tidak ada klasifikasi yang dipaksakan."
              : "Belum ada penilaian. Klik “Hitung Ulang Risiko”."}</p>
          )}
        </Card>
        <Card title="Kualitas Data">
          {risk ? (
            <div className="space-y-4">
              <Confidence comps={risk.confidence_components} />
              <p className="border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">Confidence menilai seberapa kuat bukti pendukung, dan terpisah dari skor risiko.</p>
            </div>
          ) : <p className="text-sm text-slate-600">Muncul setelah risiko dihitung.</p>}
        </Card>
      </div>

      <Card id="ai-insight" title="AI Insight (Draft)"><AiPanel objectId={id} analyses={analyses} /></Card>

      <Card title="Riwayat Indikator">
        {obs.length ? <ObservationChart years={years} series={series} /> : (
          <p className="text-sm text-slate-600">Belum ada observasi indikator. Import CSV di halaman Data Submission.</p>
        )}
      </Card>

      {obs.length > 0 && (
        <Card title="Data Observasi" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm [&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-2.5">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr><th className="sticky left-0 bg-slate-50">Indikator</th>{years.map((y) => <th key={y} className="text-right">{y}</th>)}</tr>
              </thead>
              <tbody>
                {[...byInd].map(([iid, m]) => (
                  <tr key={iid} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="raw sticky left-0 bg-white font-medium text-navy">{name.get(iid)}</td>
                    {years.map((y) => <td key={y} className="text-right tabular-nums">{m.get(y) ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            {obs.length} observasi · {[...new Set(obs.map((o) => verif(o.verification_status)))].join(", ")} · asal data {[...new Set(obs.map((o) => o.data_origin))].join(", ")}
          </p>
        </Card>
      )}
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
