"use client";
import { useRouter } from "next/navigation";
import type { ProvinceSummary } from "@/types/api";
import { Legend, RiskMap } from "./RiskMap";

export function OverviewMap({ provinces, height = 340 }: { provinces: ProvinceSummary[]; height?: number }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      <RiskMap provinces={provinces} height={height} onSelect={(code) => router.push(`/risk-mapping-gis?p=${code}`)} />
      <Legend />
    </div>
  );
}
