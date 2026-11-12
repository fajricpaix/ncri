"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

const DEMO = process.env.NEXT_PUBLIC_DEMO_LOGINS === "true"; // hanya untuk demo lokal/kompetisi
const DEMO_ROLES = ["admin", "analyst", "reviewer", "viewer"];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (r.status === 401) setError("Email atau kata sandi salah.");
      else if (r.status === 429) setError("Terlalu banyak percobaan. Coba lagi sebentar.");
      else if (!r.ok) setError("Gagal masuk. Coba lagi.");
      else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Image src="/brand/ncri-logo.svg" alt="NCRI — National Cultural Risk Intelligence" width={320} height={140} unoptimized className="mx-auto" />
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-gold" />
          </label>
          <label className="block text-sm font-medium">
            Kata sandi
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-gold" />
          </label>
          {error && <p role="alert" className="text-sm text-risk-high">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-gold py-2.5 font-semibold text-navy hover:brightness-95 disabled:opacity-60">
            {busy ? "Masuk…" : "Masuk"}
          </button>
        </form>
        {DEMO && (
          <div className="mt-5 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
            Akun demo (data SIMULATED):
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {DEMO_ROLES.map((r) => (
                <button key={r} type="button" onClick={() => { setEmail(`${r}@ncri.local`); setPassword("ncri-demo-123"); }}
                  className="rounded-md px-2.5 py-1 font-semibold capitalize ring-1 ring-slate-300 hover:bg-slate-50">
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
