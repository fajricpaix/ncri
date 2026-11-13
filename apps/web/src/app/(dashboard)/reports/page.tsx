import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { PrintButton } from "@/features/reports/PrintButton";
import { api } from "@/lib/api-server";
import { API } from "@/lib/api-client";
import type { ExecutiveReport, Region } from "@/types/api";

const f = (n: number | null, d = 0) => (n === null ? "—" : n.toFixed(d).replace(".", ","));

async function Report({ searchParams }: { searchParams: PageProps<"/reports">["searchParams"] }) {
  const sp = await searchParams;
  const province = typeof sp.province === "string" && sp.province ? sp.province : "";
  const q = province ? `?province=${encodeURIComponent(province)}` : "";
  const [r, regions] = await Promise.all([
    api<ExecutiveReport>(`/reports/executive${q}`),
    api<Region[]>("/regions?level=PROVINCE"),
  ]);
  const when = new Date(r.generated_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div className="print-hide flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm font-medium">
            Cakupan
            <select name="province" defaultValue={province} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Nasional</option>
              {regions.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </label>
          <button className="btn-gold px-3 py-2 text-sm font-semibold text-navy">Terapkan</button>
        </form>
        <PrintButton />
        <a href={`${API}/reports/objects.csv${q}`} className="text-sm text-navy-2 underline">Unduh CSV objek & risiko</a>
        <a href={`${API}/reports/early-warnings.csv`} className="text-sm text-navy-2 underline">Unduh CSV early warning</a>
      </div>

      <article className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200 print:ring-0">
        <header className="space-y-1 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">NCRI · National Cultural Risk Intelligence</p>
          <h2 className="text-2xl font-bold">Laporan Eksekutif Risiko Budaya — {r.scope}</h2>
          <p className="text-sm text-slate-600">Dibuat {when} · metode {r.method_version}</p>
        </header>

        {r.is_simulated && (
          <p role="note" className="rounded-xl border-2 border-gold bg-gold-soft p-3 text-sm font-semibold text-amber-900">
            SIMULATED — laporan ini memuat data simulasi untuk demo teknis. Bukan data resmi dan tidak boleh dipakai sebagai dasar keputusan.
          </p>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Total objek", r.total_objects], ["Dinilai", r.assessed], ["Risiko tinggi", r.distribution.HIGH],
            ["Risiko sedang", r.distribution.MEDIUM], ["Risiko rendah", r.distribution.LOW]].map(([l, v]) => (
            <div key={l as string} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{l}</p><p className="text-2xl font-bold">{v}</p></div>
          ))}
        </section>
        <p className="text-sm">
          Skor rata-rata objek yang dinilai: <b>{f(r.avg_score, 1)}</b> · data confidence rata-rata: <b>{f(r.avg_confidence, 2)}</b> ·
          data belum cukup: <b>{r.distribution.INSUFFICIENT_DATA}</b> objek · peringatan terbuka: tinggi <b>{r.open_warnings.HIGH}</b>, perubahan tajam <b>{r.open_warnings.MEDIUM}</b>, verifikasi <b>{r.open_warnings.LOW}</b>.
        </p>

        <section>
          <h3 className="mb-2 font-semibold">Objek budaya menurut skor risiko</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2">Objek</th><th>Provinsi</th><th>Skor</th><th>Tingkat</th><th>Confidence</th><th>Asal data</th></tr>
            </thead>
            <tbody>
              {r.objects.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{o.name}</td><td>{o.province ?? "—"}</td><td>{f(o.score)}</td>
                  <td><RiskBadge level={o.level} /></td><td>{f(o.confidence, 2)}</td><td>{o.data_origin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-1 text-sm">
          <h3 className="font-semibold">Metodologi & keterbatasan</h3>
          <p>Skor 0–100 dari penurunan indikator antar periode setara (penurunan {r.method_params.decline_for_max_risk_pct}% = 100). Tinggi ≥ {r.method_params.thresholds.HIGH}, sedang ≥ {r.method_params.thresholds.MEDIUM}. Asal data: {Object.entries(r.data_origins).map(([k, v]) => `${k} ${v}`).join(", ") || "—"}.</p>
          <ul className="list-disc pl-5 text-slate-600">{r.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      </article>
    </div>
  );
}

export default function Reports(props: PageProps<"/reports">) {
  return (
    <div className="space-y-4">
      <h2 className="print-hide text-xl font-bold">Reports</h2>
      <Suspense fallback={<PageLoader label="Menyusun laporan…" />}>
        <Report searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
