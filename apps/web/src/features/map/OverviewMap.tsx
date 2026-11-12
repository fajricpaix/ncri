"use client";
import { useRouter } from "next/navigation";
import type { ProvinceSummary } from "@/types/api";
import { Legend, RiskMap } from "./RiskMap";

export function OverviewMap({ provinces }: { provinces: ProvinceSummary[] }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      <RiskMap provinces={provinces} height={340} onSelect={(code) => router.push(`/risk-map?p=${code}`)} />
      <Legend />
    </div>
  );
}
