"use client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapLevel, ProvinceSummary } from "@/types/api";
import { LEVEL_LABEL } from "./levels";

// Palet khusus peta (latar navy gelap): lebih jenuh agar kontras. Badge/chart lain tetap pakai LEVEL_COLOR.
const MAP_BG = "#0f223d";
// Gradasi per skor rata-rata provinsi; titik 40 dan 70 = ambang level (risk.py), jadi warna tetap konsisten dengan label.
const RAMP: [number, string][] = [[0, "#3fb14a"], [39, "#8fd23f"], [40, "#f5c230"], [55, "#f58a2a"], [70, "#ef2b21"], [100, "#c71f18"]];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function rampColor(score: number): string {
  const v = Math.min(100, Math.max(0, score));
  const i = RAMP.findIndex(([x]) => v <= x);
  if (i <= 0) return RAMP[0][1];
  const [x0, c0] = RAMP[i - 1], [x1, c1] = RAMP[i];
  const t = (v - x0) / (x1 - x0), a = hex(c0), b = hex(c1);
  return "#" + a.map((n, k) => Math.round(n + (b[k] - n) * t).toString(16).padStart(2, "0")).join("");
}

export const MAP_COLOR: Record<MapLevel, string> = {
  HIGH: "#ef2b21", MEDIUM: "#f5c230", LOW: "#4fc24b", INSUFFICIENT_DATA: "#7b88a8", NO_DATA: "#1d3366",
};

type Props = {
  provinces: ProvinceSummary[];
  selected?: string | null;
  levelFilter?: MapLevel | "ALL";
  onSelect?: (code: string) => void;
  height?: number;
};

maplibregl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs"); // disalin oleh scripts/copy-maplibre-worker.mjs

const BOUNDS: [[number, number], [number, number]] = [[94.5, -11.5], [141.5, 6.5]];

// Peta tanpa tile pihak ketiga: hanya poligon provinsi lokal. Warna selalu didampingi tabel & legenda teks.
export function RiskMap({ provinces, selected = null, levelFilter = "ALL", onSelect, height = 360 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const sync = useRef<() => void>(() => {});
  const select = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; w: number; p: ProvinceSummary } | null>(null);

  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!box.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: box.current,
        style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": MAP_BG } }] },
        bounds: BOUNDS, fitBoundsOptions: { padding: 8 }, attributionControl: false, dragRotate: false,
      });
    } catch {
      queueMicrotask(() => setFailed(true)); // WebGL tidak tersedia
      return;
    }
    mapRef.current = map;
    // Zoom-out dikunci di ukuran "pas kanvas" supaya peta tidak mengecil sampai hilang
    const lockMinZoom = () => {
      const z = map.cameraForBounds(BOUNDS, { padding: 8 })?.zoom;
      if (z !== undefined) map.setMinZoom(z);
    };
    lockMinZoom();
    map.on("resize", lockMinZoom);
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "Batas provinsi 2017 © OpenStreetMap contributors (ODbL) via geoBoundaries" }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    const byCode = new Map(provinces.map((p) => [p.code, p]));

    map.on("load", async () => {
      const gj = await (await fetch("/geo/idn-adm1.json")).json();
      for (const f of gj.features) {
        const p = byCode.get(f.properties.code);
        const level = p?.level ?? "NO_DATA";
        const scored = p?.avg_score != null && (level === "HIGH" || level === "MEDIUM" || level === "LOW");
        f.properties = { code: f.properties.code, level, color: scored ? rampColor(p!.avg_score!) : MAP_COLOR[level as MapLevel] };
      }
      map.addSource("prov", { type: "geojson", data: gj });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 1,
      } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#ffffff", "line-opacity": 0.45, "line-width": 0.5 } });
      // efek "terangkat": salinan provinsi yang di-hover digeser ke atas, dengan bayangan di bawahnya
      const none = ["==", ["get", "code"], ""] as maplibregl.FilterSpecification;
      map.addLayer({ id: "lift-shadow", type: "fill", source: "prov", filter: none, paint: { "fill-color": "#000", "fill-opacity": 0.35, "fill-translate": [0, 0], "fill-translate-transition": { duration: 160, delay: 0 } } });
      map.addLayer({ id: "lift", type: "fill", source: "prov", filter: none, paint: { "fill-color": ["get", "color"], "fill-translate": [0, 0], "fill-translate-transition": { duration: 160, delay: 0 } } });
      map.addLayer({ id: "lift-line", type: "line", source: "prov", filter: none, paint: { "line-color": "#ffffff", "line-width": 1.2, "line-translate": [0, 0], "line-translate-transition": { duration: 160, delay: 0 } } });
      map.addLayer({ id: "sel", type: "line", source: "prov", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#ffffff", "line-width": 2.5 } });
      ready.current = true;
      sync.current();
    });

    let hovered = "";
    const lift = (code: string) => {
      if (code === hovered) return;
      hovered = code;
      const f: maplibregl.FilterSpecification = ["==", ["get", "code"], code];
      for (const id of ["lift-shadow", "lift", "lift-line"]) map.setFilter(id, f);
      // set ke posisi diam dulu, lalu geser di frame berikut supaya transisi jalan
      const up = code ? -4 : 0, sh = code ? 1 : 0;
      map.setPaintProperty("lift-shadow", "fill-translate", [0, 0]);
      map.setPaintProperty("lift", "fill-translate", [0, 0]);
      map.setPaintProperty("lift-line", "line-translate", [0, 0]);
      requestAnimationFrame(() => {
        if (hovered !== code) return;
        map.setPaintProperty("lift-shadow", "fill-translate", [0, sh]);
        map.setPaintProperty("lift", "fill-translate", [0, up]);
        map.setPaintProperty("lift-line", "line-translate", [0, up]);
      });
    };
    map.on("mousemove", "fill", (e) => {
      const code = e.features?.[0]?.properties?.code as string | undefined;
      const p = code ? byCode.get(code) : undefined;
      map.getCanvas().style.cursor = "pointer";
      if (p) { lift(p.code); setTip({ x: e.point.x, y: e.point.y, w: box.current?.clientWidth ?? 0, p }); }
    });
    map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; lift(""); setTip(null); });
    map.on("click", "fill", (e) => {
      const code = e.features?.[0]?.properties?.code as string | undefined;
      if (code) select.current?.(code);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(box.current);
    return () => { ro.disconnect(); ready.current = false; map.remove(); mapRef.current = null; };
  }, [provinces]);

  // sinkronkan pilihan & filter tanpa membuat ulang peta
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!ready.current) return;
      map.setFilter("sel", ["==", ["get", "code"], selected ?? ""]);
      map.setPaintProperty("fill", "fill-opacity",
        levelFilter === "ALL" ? 1 : ["case", ["==", ["get", "level"], levelFilter], 1, 0.2]);
    };
    sync.current = apply;
    apply();
  }, [selected, levelFilter, provinces]);

  if (failed)
    return <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600" style={{ minHeight: height }}>Peta tidak dapat dimuat di perangkat ini (WebGL tidak tersedia). Gunakan tabel provinsi.</p>;
  const d = tip?.p.distribution;
  const rows: [string, number][] = tip ? [["Objek Budaya", tip.p.n_objects], ["Risiko Tinggi", d?.HIGH ?? 0], ["Risiko Sedang", d?.MEDIUM ?? 0], ["Risiko Rendah", d?.LOW ?? 0]] : [];
  return (
    <div className="relative">
      <div ref={box} role="img" aria-label="Peta risiko provinsi Indonesia. Data lengkap tersedia pada tabel provinsi." className="w-full overflow-hidden rounded-xl" style={{ height }} />
      {tip && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 w-max rounded-lg bg-white px-3 py-2 text-xs leading-snug text-navy shadow-lg ring-1 ring-black/5"
          style={{ left: tip.x, top: tip.y, transform: `translate(${tip.x > tip.w / 2 ? "calc(-100% - 14px)" : "14px"}, ${tip.y > height / 2 ? "calc(-100% - 8px)" : "8px"})` }}
        >
          <b className="raw mb-1 block text-[13px]">{tip.p.name}</b>
          <dl className="grid grid-cols-[auto_auto] gap-x-1.5">
            {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="font-medium">{k}</dt><dd className="font-semibold">: {v}</dd></div>))}
          </dl>
        </div>
      )}
    </div>
  );
}

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legenda peta">
      {(Object.keys(MAP_COLOR) as MapLevel[]).map((l) => (
        <li key={l} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: MAP_COLOR[l] }} aria-hidden />
          {LEVEL_LABEL[l]}
        </li>
      ))}
    </ul>
  );
}
