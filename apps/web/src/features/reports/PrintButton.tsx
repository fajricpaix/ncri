"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">
      <Printer size={16} aria-hidden /> Cetak / simpan PDF
    </button>
  );
}
