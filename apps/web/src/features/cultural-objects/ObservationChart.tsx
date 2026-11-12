"use client";
import { EChart } from "@/components/charts/EChart";

export type Series = { name: string; data: (number | null)[] };

// null = data hilang → garis putus (gap), bukan nol.
export function ObservationChart({ years, series }: { years: string[]; series: Series[] }) {
  return (
    <EChart
      height={300}
      option={{
        tooltip: { trigger: "axis" },
        legend: { bottom: 0 },
        grid: { left: 40, right: 16, top: 16, bottom: 56 },
        xAxis: { type: "category", data: years },
        yAxis: { type: "value" },
        series: series.map((s) => ({ type: "line" as const, name: s.name, data: s.data, connectNulls: false })),
      }}
    />
  );
}
