// Turbopack tidak menyertakan web worker MapLibre; sajikan file worker dari /public dan pakai setWorkerUrl().
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/vendor/maplibre", { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`node_modules/maplibre-gl/dist/${f}`, `public/vendor/maplibre/${f}`);
}
