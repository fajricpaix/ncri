"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-2xl bg-white p-6 ring-1 ring-red-200">
      <h2 className="font-semibold text-risk-high">Gagal memuat data</h2>
      <p className="mt-1 text-sm text-slate-600">Pastikan API berjalan (http://localhost:8000) lalu coba lagi.</p>
      <button onClick={reset} className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Coba lagi</button>
    </div>
  );
}
