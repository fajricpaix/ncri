"use client";
import { EChart } from "@/components/charts/EChart";
import type { Overview } from "@/types/api";

const LINES = [
  ["HIGH", "Tinggi", "#d64545"],
  ["MEDIUM", "Sedang", "#e8a317"],
  ["LOW", "Rendah", "#2e9e5b"],
] as const;

export function TrendChart({ trend }: { trend: Overview["trend"] }) {
  return (
    <EChart
      height={240}
      option={{
        tooltip: { trigger: "axis" },
        legend: { bottom: 0 },
        grid: { left: 40, right: 16, top: 16, bottom: 40 },
        xAxis: { type: "category", data: trend.map((t) => t.period_end.slice(0, 4)) },
        yAxis: { type: "value", minInterval: 1 },
        series: LINES.map(([k, name, color]) => ({
          type: "line" as const, name, data: trend.map((t) => t[k]),
          lineStyle: { color, width: 3 }, itemStyle: { color },
        })),
      }}
    />
  );
}
