"use client";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export function EChart({ option, height = 240 }: { option: EChartsOption; height?: number }) {
  return <ReactECharts option={option} style={{ height }} notMerge />;
}
