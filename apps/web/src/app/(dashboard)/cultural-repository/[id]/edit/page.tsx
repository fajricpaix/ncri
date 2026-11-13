import { notFound } from "next/navigation";
import { PageLoader } from "@/components/ui/PageLoader";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { ObjectForm } from "@/features/cultural-repository/ObjectForm";
import { api, getMe, serverFetch } from "@/lib/api-server";
import { can } from "@/lib/permissions";
import type { CulturalObject, DataSource, Region } from "@/types/api";

async function Content({ params }: { params: PageProps<"/cultural-repository/[id]/edit">["params"] }) {
  const { id } = await params;
  const me = await getMe();
  if (!can(me.role, "analyze")) return <p className="text-sm text-slate-600">Hanya Analyst atau Admin yang bisa mengubah objek.</p>;
  const res = await serverFetch(`/cultural-objects/${id}`);
  if (res.status === 404 || res.status === 422) notFound();
  if (!res.ok) throw new Error(`API ${res.status}`);
  const [obj, provinces, sources] = await Promise.all([
    res.json() as Promise<CulturalObject>, api<Region[]>("/regions?level=PROVINCE"), api<DataSource[]>("/data-sources"),
  ]);
  return <ObjectForm initial={obj} provinces={provinces} sources={sources} />;
}

export default function EditObject(props: PageProps<"/cultural-repository/[id]/edit">) {
  return (
    <Card title="Edit Objek Budaya">
      <Suspense fallback={<PageLoader label="Memuat…" />}><Content params={props.params} /></Suspense>
    </Card>
  );
}
