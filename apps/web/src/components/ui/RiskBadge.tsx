const MAP = {
  HIGH: { label: "Tinggi", cls: "bg-red-50 text-risk-high ring-red-200", icon: "▲" },
  MEDIUM: { label: "Sedang", cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: "●" },
  LOW: { label: "Rendah", cls: "bg-green-50 text-risk-low ring-green-200", icon: "✓" },
  INSUFFICIENT_DATA: { label: "Data Kurang", cls: "bg-slate-100 text-slate-600 ring-slate-200", icon: "?" },
} as const;

export type RiskLevel = keyof typeof MAP;

// Warna + ikon + teks: tidak mengandalkan warna saja.
export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = MAP[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${m.cls}`}>
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}
