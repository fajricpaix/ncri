import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { WarningActions } from "@/features/early-warnings/WarningActions";
import { api } from "@/lib/api-server";
import type { Warning } from "@/types/api";

const STATUS: Record<string, string> = { OPEN: "Terbuka", IN_REVIEW: "Ditinjau", RESOLVED: "Selesai", DISMISSED: "Diabaikan" };

async function List() {
  const rows = await api<Warning[]>("/early-warnings");
  if (!rows.length) return <p className="text-sm text-slate-600">Belum ada peringatan. Jalankan “Hitung ulang risiko” di Overview.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr><th className="py-2">Tingkat</th><th>Objek & peringatan</th><th>Status</th><th>Aksi</th></tr>
      </thead>
      <tbody>
        {rows.map((w) => (
          <tr key={w.id} className="border-t border-slate-100 align-top">
            <td className="py-2.5"><RiskBadge level={w.severity} /></td>
            <td>
              <Link href={`/cultural-repository/${w.cultural_object_id}`} className="font-medium text-navy-2 hover:underline">{w.object_name}</Link>
              <span className="block font-medium">{w.title}</span>
              <span className="block text-xs text-slate-500">{w.description}</span>
            </td>
            <td>{STATUS[w.status] ?? w.status}</td>
            <td><WarningActions id={w.id} status={w.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EarlyWarnings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Early Warning</h2>
      <p className="text-sm text-slate-600">Sinyal untuk diperiksa, bukan bukti bahwa suatu budaya terancam.</p>
      <Card className="overflow-x-auto">
        <Suspense fallback={<PageLoader label="Memuat…" />}><List /></Suspense>
      </Card>
    </div>
  );
}
