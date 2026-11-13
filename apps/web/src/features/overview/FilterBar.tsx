import Link from "next/link";
import { Filter, RotateCcw } from "lucide-react";

type Opt = [value: string, label: string];
const sel = "raw mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold";

// Form GET biasa: tanpa JS, filter hidup di URL (bisa dibagikan).
export function FilterBar({ action, categories, provinces, levels, values }: { action: string; categories: Opt[]; provinces: Opt[]; levels: Opt[]; values: Record<string, string> }) {
  const fields: [string, string, Opt[], string][] = [
    ["cat", "Jenis Budaya", categories, "Semua Jenis"],
    ["prov", "Provinsi", provinces, "Semua Provinsi"],
    ["lvl", "Tingkat Risiko", levels, "Semua Risiko"],
  ];
  return (
    <form action={action} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto]">
      {fields.map(([name, label, opts, all]) => (
        <label key={name} className="text-xs font-semibold text-navy">
          {label}
          <select name={name} defaultValue={values[name] ?? ""} className={sel}>
            <option value="">{all}</option>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      ))}
      <div className="flex items-end gap-2">
        <Link href={action} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"><RotateCcw size={14} aria-hidden />Reset</Link>
        <button type="submit" className="inline-flex items-center gap-1.5 btn-gold px-4 py-2 text-sm font-semibold text-navy"><Filter size={14} aria-hidden />Terapkan</button>
      </div>
    </form>
  );
}
