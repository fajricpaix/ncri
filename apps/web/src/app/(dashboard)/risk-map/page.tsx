import { Suspense } from "react";
import { RiskMapExplorer } from "@/features/map/RiskMapExplorer";
import { api } from "@/lib/api-server";
import type { ProvinceSummary } from "@/types/api";

async function Content({ searchParams }: { searchParams: PageProps<"/risk-map">["searchParams"] }) {
  const [provinces, sp] = await Promise.all([api<ProvinceSummary[]>("/map/provinces"), searchParams]);
  const p = typeof sp.p === "string" ? sp.p : null;
  return <RiskMapExplorer provinces={provinces} initial={p} />;
}

export default function RiskMapPage(props: PageProps<"/risk-map">) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">National Risk Map</h2>
      <Suspense fallback={<p className="text-sm text-slate-500">Memuat peta…</p>}>
        <Content searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
