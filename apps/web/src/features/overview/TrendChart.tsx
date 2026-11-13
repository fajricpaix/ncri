"use client";
import { EChart } from "@/components/charts/EChart";
import type { Overview } from "@/types/api";

const LINES = [
  ["HIGH", "Tinggi", "#d64545"],
  ["MEDIUM", "Sedang", "#e8a317"],
  ["LOW", "Rendah", "#2e9e5b"],
] as const;

export function TrendChart({ trend, height = 260 }: { trend: Overview["trend"]; height?: number }) {
  return (
    <EChart
      height={height}
      option={{
        tooltip: { trigger: "axis" },
        legend: { bottom: 0, icon: "roundRect", itemHeight: 8 },
        grid: { left: 40, right: 16, top: 16, bottom: 56 },
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
