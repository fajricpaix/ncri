import type { LucideIcon } from "lucide-react";
import { StatBubble } from "./StatBubble";
import { toneOf, type Tone } from "./stat-tone";

export { toneOf };

// Kartu statistik: gelembung ikon (animasi Lottie) di kiri, angka besar dan label di kanan. Aman dipakai dari server maupun client component.
export function StatCard({ icon: Icon, label, value, tone = "blue", foot, sim }: {
  icon: LucideIcon; label: string; value: React.ReactNode; tone?: Tone; foot?: React.ReactNode; sim?: boolean;
}) {
  return (
    <div data-stat className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
      <StatBubble tone={tone}><Icon aria-hidden size={28} strokeWidth={2} fill="currentColor" fillOpacity={0.2} /></StatBubble>
      <div className="min-w-0">
        <p className="text-[28px] font-extrabold leading-none text-navy">{value}</p>
        <p className="cap mt-1.5 text-[13px] font-medium leading-tight text-slate-700">{label}{sim && <span className="ml-1 rounded bg-gold-soft px-1 text-[9px] font-bold text-amber-800 align-middle" title="Data contoh">SIM</span>}</p>
        {foot && <div className="mt-1">{foot}</div>}
      </div>
    </div>
  );
}
