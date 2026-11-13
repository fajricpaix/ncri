import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { RiskMappingGis } from "@/features/risk-mapping-gis/RiskMappingGis";
import { api } from "@/lib/api-server";
import type { ProvinceSummary } from "@/types/api";

async function Content({ searchParams }: { searchParams: PageProps<"/risk-mapping-gis">["searchParams"] }) {
  const [provinces, sp] = await Promise.all([api<ProvinceSummary[]>("/map/provinces"), searchParams]);
  return <RiskMappingGis provinces={provinces} initial={typeof sp.p === "string" ? sp.p : null} />;
}

export default function RiskMappingGisPage(props: PageProps<"/risk-mapping-gis">) {
  return (
    <Suspense fallback={<PageLoader label="Memuat peta…" />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
