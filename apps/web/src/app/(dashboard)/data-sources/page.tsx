import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card } from "@/components/ui/Card";
import { AiDiscovery } from "@/features/data-sources/AiDiscovery";
import { CsvImport } from "@/features/data-sources/CsvImport";
import { api } from "@/lib/api-server";
import type { DataSource } from "@/types/api";

async function Sources() {
  const sources = await api<DataSource[]>("/data-sources");
  if (!sources.length) return <p className="text-sm text-slate-600">Belum ada sumber data.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr><th className="py-2">Kode</th><th>Nama</th><th>Tipe</th><th>Catatan</th></tr>
      </thead>
      <tbody>
        {sources.map((s) => (
          <tr key={s.id} className="border-t border-slate-100">
            <td className="py-2.5 font-mono">{s.code}</td><td className="font-medium">{s.name}</td>
            <td>{s.source_type}</td><td className="text-slate-600">{s.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DataSources() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Data Submission</h2>
      <Card title="Sumber Data" className="overflow-x-auto">
        <Suspense fallback={<PageLoader label="Memuat…" />}><Sources /></Suspense>
      </Card>
      <Card title="Cari Data Dengan AI">
        <AiDiscovery />
      </Card>
      <Card title="Import Data (CSV)">
        <CsvImport />
      </Card>
    </div>
  );
}
