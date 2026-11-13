import type { MapLevel } from "@/types/api";

export const LEVEL_COLOR: Record<MapLevel, string> = {
  HIGH: "#d64545", MEDIUM: "#e8a317", LOW: "#2e9e5b", INSUFFICIENT_DATA: "#8a94a6", NO_DATA: "#e2e8f0",
};
export const LEVEL_LABEL: Record<MapLevel, string> = {
  HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Rendah", INSUFFICIENT_DATA: "Data Kurang", NO_DATA: "Tidak ada objek",
};
