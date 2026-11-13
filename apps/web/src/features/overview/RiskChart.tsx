"use client";
import { EChart } from "@/components/charts/EChart";
import type { Overview } from "@/types/api";

export function RiskChart({ distribution, total, height = 240 }: { distribution: Overview["distribution"]; total: number; height?: number }) {
  return (
    <EChart
      height={height}
      option={{
        tooltip: { trigger: "item" },
        legend: { orient: "vertical", right: 0, top: "middle", itemWidth: 12, itemHeight: 12 },
        title: { text: total.toLocaleString("id-ID"), subtext: "objek", left: "28%", top: "38%", textAlign: "center", textStyle: { fontSize: 24 } },
        series: [{
          type: "pie", radius: ["52%", "78%"], center: ["32%", "50%"], label: { show: false },
          data: [
            { name: "Tinggi", value: distribution.HIGH, itemStyle: { color: "#d64545" } },
            { name: "Sedang", value: distribution.MEDIUM, itemStyle: { color: "#e8a317" } },
            { name: "Rendah", value: distribution.LOW, itemStyle: { color: "#2e9e5b" } },
            { name: "Data Kurang", value: distribution.INSUFFICIENT_DATA, itemStyle: { color: "#8a94a6" } },
          ],
        }],
      }}
    />
  );
}
