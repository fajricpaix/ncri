import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { api, getMe } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { CulturalObject, Region } from "@/types/api";

async function List() {
  const [objects, regions] = await Promise.all([
    api<CulturalObject[]>("/cultural-objects?limit=200"),
    api<Region[]>("/regions"),
  ]);
  const region = new Map(regions.map((r) => [r.id, r.name]));
  if (!objects.length) return <p className="text-sm text-slate-600">Belum ada objek budaya. Jalankan seed atau import CSV.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr><th className="py-2">Objek</th><th>Kategori</th><th>Provinsi</th><th>Verifikasi</th><th>Asal data</th></tr>
      </thead>
      <tbody>
        {objects.map((o) => (
          <tr key={o.id} className="border-t border-slate-100">
            <td className="py-2.5 font-medium">
              <Link href={`/cultural-objects/${o.id}`} className="text-navy-2 underline-offset-2 hover:underline">{o.name}</Link>
              <span className="block text-xs text-slate-500">{o.external_code}</span>
            </td>
            <td>{o.category}</td>
            <td>{o.region_id ? region.get(o.region_id) : "—"}</td>
            <td>{o.verification_status}</td>
            <td><OriginBadge origin={o.data_origin} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function AddButton() {
  const me = await getMe();
  if (!can(me.role, "analyze")) return null;
  return <Link href="/cultural-objects/new" className="cap rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">+ Tambah objek</Link>;
}

export default function CulturalObjects() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Cultural Objects</h2>
        <Suspense fallback={null}><AddButton /></Suspense>
      </div>
      <Card className="overflow-x-auto">
        <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
          <List />
        </Suspense>
      </Card>
    </div>
  );
}
