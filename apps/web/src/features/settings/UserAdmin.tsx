"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { ROLE_LABEL, type Role, type User } from "@/lib/permissions";
import { Select } from "@/components/ui/Select";

const ROLES = Object.keys(ROLE_LABEL) as Role[];
const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold";

export function UserAdmin({ users, meId }: { users: User[]; meId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" as Role });

  async function call(path: string, method: string, body: object) {
    setMsg(null);
    const r = await apiFetch(path, { method, body: JSON.stringify(body) });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(typeof d.detail === "string" ? d.detail : "Gagal: periksa isian (kata sandi minimal 10 karakter).");
      return false;
    }
    router.refresh();
    return true;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/users", "POST", form)) setForm({ name: "", email: "", password: "", role: "VIEWER" });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Nama</th><th>Email</th><th>Role</th><th>Aktif</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2.5 font-medium">{u.name}{u.id === meId && <span className="ml-2 text-xs text-slate-500">(Anda)</span>}</td>
                <td>{u.email}</td>
                <td>
                  <Select aria-label={`Role ${u.email}`} value={u.role} disabled={u.id === meId}
                    onValueChange={(v) => call(`/users/${u.id}`, "PATCH", { role: v })}
                    className="min-w-36 !py-1">
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </Select>
                </td>
                <td>
                  <input type="checkbox" aria-label={`Aktif ${u.email}`} checked={u.is_active} disabled={u.id === meId}
                    onChange={(e) => call(`/users/${u.id}`, "PATCH", { is_active: e.target.checked })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={create} className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-medium">Nama<input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm font-medium">Email<input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="text-sm font-medium">Kata sandi awal<input required type="password" minLength={10} autoComplete="new-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label className="text-sm font-medium">Role
          <Select className="mt-1 w-full" value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </label>
        <button className="self-end rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Tambah pengguna</button>
      </form>
      {msg && <p role="alert" className="text-sm text-risk-high">{msg}</p>}
    </div>
  );
}
