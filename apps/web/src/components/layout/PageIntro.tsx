"use client";
import { Info } from "lucide-react";
import { usePathname } from "next/navigation";
import { ABOUT_EXTRA, NAV } from "./nav";

// Kartu penjelasan singkat fungsi halaman, tepat di bawah header. Hanya di halaman menu (bukan detail/form).
export function PageIntro() {
  const path = usePathname();
  const text = ABOUT_EXTRA[path] ?? NAV.find((n) => n.href === path)?.about;
  if (!text) return null;
  return (
    <section aria-label="Fungsi halaman" className="print-hide mb-4 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
      <span className="grid size-9 shrink-0 place-content-center rounded-full bg-blue-50 text-navy-2"><Info size={18} aria-hidden /></span>
      <div className="min-w-0">
        <p className="cap text-sm font-bold text-navy">Fungsi Halaman Ini</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{text}</p>
      </div>
    </section>
  );
}
