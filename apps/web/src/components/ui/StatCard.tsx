import type { LucideIcon } from "lucide-react";
import { StatBubble } from "@/components/ui/StatBubble";
import { toneOf, type Tone } from "@/components/ui/stat-tone";

export { toneOf };

// Kartu statistik: gelembung ikon (animasi Lottie) di kiri, angka besar dan label di kanan. Aman dipakai dari server maupun client component.
export function StatCard({ icon: Icon, label, value, tone = "blue", foot }: {
  icon: LucideIcon; label: string; value: React.ReactNode; tone?: Tone; foot?: React.ReactNode;
}) {
  return (
    <div data-stat className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
      <StatBubble tone={tone}><Icon aria-hidden size={28} strokeWidth={2} fill="currentColor" fillOpacity={0.2} /></StatBubble>
      <div className="min-w-0">
        <p className="text-[28px] font-extrabold leading-none text-navy">{value}</p>
        <p className="cap mt-1.5 text-[13px] font-medium leading-tight text-slate-700">{label}</p>
        {foot && <div className="mt-1">{foot}</div>}
      </div>
    </div>
  );
}
