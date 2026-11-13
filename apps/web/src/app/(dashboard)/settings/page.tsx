import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { LlmSettings, type LlmSettingsData } from "@/features/settings/LlmSettings";
import { UserAdmin } from "@/features/settings/UserAdmin";
import { api, getMe } from "@/lib/api-server";
import type { User } from "@/lib/permissions";

type AuditRow = { id: string; at: string; user: string | null; action: string; entity_type: string; metadata: Record<string, unknown> };

async function Content() {
  const me = await getMe();
  if (me.role !== "ADMIN")
    return <Card><p className="text-sm text-slate-600">Halaman ini hanya untuk Admin. Role Anda: {me.role}.</p></Card>;
  const [users, logs, llm] = await Promise.all([api<User[]>("/users"), api<AuditRow[]>("/audit-logs?limit=50"), api<LlmSettingsData>("/admin/llm-settings")]);
  return (
    <div className="space-y-4">
      <Card title="Pengguna & Role"><UserAdmin users={users} meId={me.id} /></Card>
      <Card title="Pengaturan LLM"><LlmSettings data={llm} /></Card>
      <Card title="Audit Log (50 terbaru)" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Waktu</th><th>Pengguna</th><th>Aksi</th><th>Objek</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 align-top">
                <td className="py-2 whitespace-nowrap">{new Date(l.at).toLocaleString("id-ID")}</td>
                <td>{l.user ?? "—"}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td>{l.entity_type}</td>
                <td className="text-xs text-slate-500">{JSON.stringify(l.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}><Content /></Suspense>
    </div>
  );
}
