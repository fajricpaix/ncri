"use client";
import { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

// Chart baru dirender setelah wadahnya punya lebar (hindari warning ECharts "DOM width or height" = 0).
export function EChart({ option, height = 240 }: { option: EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.clientWidth > 0 && setReady(true));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ height, width: "100%" }}>
      {ready && <ReactECharts option={option} style={{ height }} notMerge />}
    </div>
  );
}
