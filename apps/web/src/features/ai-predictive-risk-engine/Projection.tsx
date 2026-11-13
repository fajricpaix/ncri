"use client";
import { EChart } from "@/components/charts/EChart";
import { projectScore } from "./sim";

// Hanya titik "saat ini" yang nyata; garis proyeksi SIMULATED. Riwayat skor per objek belum tersedia dari API, jadi tidak digambar.
export function Projection({ score, year }: { score: number; year: number }) {
  const p = projectScore(score);
  const xs = p.map((d) => String(year + d.y));
  return (
    <EChart
      height={270}
      option={{
        tooltip: { trigger: "axis" },
        legend: { bottom: 0, data: ["Skor Saat Ini", "Proyeksi (Simulasi)"] },
        grid: { left: 36, right: 16, top: 28, bottom: 40 },
        xAxis: { type: "category", data: xs },
        yAxis: { type: "value", min: 0, max: 100 },
        series: [
          { name: "lo", type: "line", data: p.map((d) => d.lo), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, tooltip: { show: false } },
          { name: "Rentang", type: "line", data: p.map((d) => d.hi - d.lo), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(214,69,69,.15)" }, tooltip: { show: false } },
          { name: "Proyeksi (Simulasi)", type: "line", data: p.map((d) => d.mid), lineStyle: { type: "dashed", color: "#d64545", width: 3 }, itemStyle: { color: "#d64545" }, label: { show: true, position: "top" } },
          { name: "Skor Saat Ini", type: "scatter", data: [[xs[0], score]], symbolSize: 12, itemStyle: { color: "#0b2a5b" } },
        ],
      }}
    />
  );
}
