import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card } from "@/components/ui/Card";
import { ObjectForm } from "@/features/cultural-repository/ObjectForm";
import { api, getMe } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { DataSource, Region } from "@/types/api";

async function Content() {
  const me = await getMe();
  if (!can(me.role, "analyze")) return <p className="text-sm text-slate-600">Hanya Analyst atau Admin yang bisa menambah objek.</p>;
  const [provinces, sources] = await Promise.all([api<Region[]>("/regions?level=PROVINCE"), api<DataSource[]>("/data-sources")]);
  return <ObjectForm provinces={provinces} sources={sources} />;
}

export default function NewObject() {
  return (
    <Card title="Tambah Objek Budaya">
      <Suspense fallback={<PageLoader label="Memuat…" />}><Content /></Suspense>
    </Card>
  );
}
