"use client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapLevel, ProvinceSummary } from "@/types/api";
import { LEVEL_COLOR, LEVEL_LABEL } from "./levels";

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

  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!box.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: box.current,
        style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#dbe7f3" } }] },
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
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    const byCode = new Map(provinces.map((p) => [p.code, p]));

    map.on("load", async () => {
      const gj = await (await fetch("/geo/idn-adm1.json")).json();
      for (const f of gj.features) {
        const p = byCode.get(f.properties.code);
        f.properties = { code: f.properties.code, level: p?.level ?? "NO_DATA" };
      }
      map.addSource("prov", { type: "geojson", data: gj });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: {
        "fill-color": ["match", ["get", "level"], ...Object.entries(LEVEL_COLOR).flat(), "#e2e8f0"] as never,
        "fill-opacity": 0.9,
      } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#ffffff", "line-width": 0.8 } });
      map.addLayer({ id: "sel", type: "line", source: "prov", filter: ["==", ["get", "code"], ""], paint: { "line-color": "#0b1f4b", "line-width": 3 } });
      ready.current = true;
      sync.current();
    });

    map.on("mousemove", "fill", (e) => {
      const code = e.features?.[0]?.properties?.code as string | undefined;
      const p = code ? byCode.get(code) : undefined;
      map.getCanvas().style.cursor = "pointer";
      if (p) popup.setLngLat(e.lngLat).setHTML(`<b>${p.name}</b><br>${LEVEL_LABEL[p.level]}${p.avg_score !== null ? ` · skor ${p.avg_score}` : ""} · ${p.n_objects} objek`).addTo(map);
    });
    map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
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
        levelFilter === "ALL" ? 0.9 : ["case", ["==", ["get", "level"], levelFilter], 0.95, 0.15]);
    };
    sync.current = apply;
    apply();
  }, [selected, levelFilter, provinces]);

  if (failed)
    return <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600" style={{ minHeight: height }}>Peta tidak dapat dimuat di perangkat ini (WebGL tidak tersedia). Gunakan tabel provinsi.</p>;
  return <div ref={box} role="img" aria-label="Peta risiko provinsi Indonesia. Data lengkap tersedia pada tabel provinsi." className="w-full overflow-hidden rounded-xl" style={{ height }} />;
}

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legenda peta">
      {(Object.keys(LEVEL_COLOR) as MapLevel[]).map((l) => (
        <li key={l} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: LEVEL_COLOR[l] }} aria-hidden />
          {LEVEL_LABEL[l]}
        </li>
      ))}
    </ul>
  );
}
