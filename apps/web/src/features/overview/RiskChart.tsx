"use client";
import { EChart } from "@/components/charts/EChart";
import type { Overview } from "@/types/api";

export function RiskChart({ distribution, total }: { distribution: Overview["distribution"]; total: number }) {
  return (
    <EChart
      height={240}
      option={{
        tooltip: { trigger: "item" },
        legend: { bottom: 0 },
        title: { text: total.toLocaleString("id-ID"), subtext: "objek", left: "center", top: "34%", textStyle: { fontSize: 24 } },
        series: [{
          type: "pie", radius: ["55%", "78%"], label: { show: false },
          data: [
            { name: "Tinggi", value: distribution.HIGH, itemStyle: { color: "#d64545" } },
            { name: "Sedang", value: distribution.MEDIUM, itemStyle: { color: "#e8a317" } },
            { name: "Rendah", value: distribution.LOW, itemStyle: { color: "#2e9e5b" } },
            { name: "Data kurang", value: distribution.INSUFFICIENT_DATA, itemStyle: { color: "#8a94a6" } },
          ],
        }],
      }}
    />
  );
}
