import type { Origin } from "@/types/api";

export function OriginBadge({ origin }: { origin: Origin }) {
  const label = origin === "PUBLIC" ? "PUBLIC" : "PARTNER DATA";
  return <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-wider text-blue-800 ring-1 ring-blue-200">{label}</span>;
}
