"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MapLevel, ProvinceSummary } from "@/types/api";
import { Legend, RiskMap } from "./RiskMap";

// Klik provinsi = set filter ?prov=, tabel + panel detail ikut berubah.
export function MapCard({ provinces, selected, level, height = 380 }: { provinces: ProvinceSummary[]; selected: string | null; level: MapLevel | "ALL"; height?: number }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const pick = (code: string) => {
    const q = new URLSearchParams(sp);
    q.delete("p"); q.delete("page"); q.delete("obj");
    if (selected === code) q.delete("prov"); else q.set("prov", code);
    router.push(`${path}?${q}`, { scroll: false });
  };
  return (
    <div className="space-y-3">
      <RiskMap provinces={provinces} selected={selected} levelFilter={level} onSelect={pick} height={height} />
      <Legend />
      <p className="text-xs text-slate-500">Warna = skor rata-rata objek yang dinilai di provinsi itu (bisa menyembunyikan satu objek berisiko tinggi). Batas provinsi 2017: pemekaran Papua digambar sebagai induknya. Klik provinsi lagi untuk melepas filter.</p>
    </div>
  );
}
