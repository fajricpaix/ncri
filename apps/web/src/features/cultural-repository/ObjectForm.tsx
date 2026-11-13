"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CulturalObject, DataSource, Region } from "@/types/api";

const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-gold";
const label = "block text-sm font-medium";

/** Tambah (tanpa `initial`) atau edit objek budaya. Asal data hanya dipilih saat tambah: tidak bisa diubah setelahnya. */
export function ObjectForm({ initial, provinces, sources }: { initial?: CulturalObject; provinces: Region[]; sources: DataSource[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => (f.get(k) as string | null)?.trim() || null;
    const num = (k: string) => (text(k) === null ? null : Number(text(k)));
    const body: Record<string, unknown> = {
      name: text("name"), category: text("category"), external_code: text("external_code"),
      description: text("description"), region_id: text("region_id"), source_id: text("source_id"),
      latitude: num("latitude"), longitude: num("longitude"),
    };
    if (!initial) body.data_origin = text("data_origin");

    setBusy(true);
    setError("");
    try {
      const r = await apiFetch(initial ? `/cultural-objects/${initial.id}` : "/cultural-objects", {
        method: initial ? "PATCH" : "POST", body: JSON.stringify(body),
      });
      if (!r.ok) {
        const detail = (await r.json().catch(() => null))?.detail;
        throw new Error(r.status === 403 ? "Role Anda tidak berwenang mengubah objek."
          : typeof detail === "string" ? detail : "Data belum valid, periksa lagi isian Anda.");
      }
      const saved: CulturalObject = await r.json();
      router.push(`/cultural-repository/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>Nama objek *
          <input name="name" required maxLength={200} defaultValue={initial?.name} className={input} />
        </label>
        <label className={label}>Kategori *
          <input name="category" required maxLength={100} defaultValue={initial?.category} placeholder="mis. Seni Pertunjukan" className={input} />
        </label>
        <label className={label}>Kode eksternal
          <input name="external_code" maxLength={100} defaultValue={initial?.external_code ?? ""} placeholder="opsional, harus unik" className={input} />
        </label>
        <label className={label}>Provinsi
          <select name="region_id" defaultValue={initial?.region_id ?? ""} className={input}>
            <option value="">—</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className={label}>Latitude
          <input name="latitude" type="number" step="any" min={-90} max={90} defaultValue={initial?.latitude ?? ""} className={input} />
        </label>
        <label className={label}>Longitude
          <input name="longitude" type="number" step="any" min={-180} max={180} defaultValue={initial?.longitude ?? ""} className={input} />
        </label>
        <label className={label}>Sumber data
          <select name="source_id" defaultValue={initial?.source_id ?? ""} className={input}>
            <option value="">—</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        {initial ? (
          <div className={label}>Asal data
            <p className="mt-1 py-2 text-sm font-normal text-slate-600">{initial.data_origin} <span className="text-xs">(tidak bisa diubah)</span></p>
          </div>
        ) : (
          <label className={label}>Asal data *
            <select name="data_origin" required defaultValue="" className={input}>
              <option value="" disabled>Pilih asal data…</option>
              <option value="SIMULATED">SIMULATED (data contoh)</option>
              <option value="PUBLIC">PUBLIC (dataset publik)</option>
              <option value="PARTNER">PARTNER (mitra/instansi)</option>
            </select>
          </label>
        )}
      </div>
      <label className={label}>Deskripsi
        <textarea name="description" rows={4} maxLength={2000} defaultValue={initial?.description ?? ""} className={`${input} resize-y`} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-risk-high">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Link href={initial ? `/cultural-repository/${initial.id}` : "/cultural-repository"} className="cap rounded-lg px-4 py-2 text-sm ring-1 ring-slate-300 hover:bg-slate-50">Batal</Link>
        <button disabled={busy} className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Menyimpan…" : initial ? "Simpan perubahan" : "Tambah objek"}
        </button>
      </div>
    </form>
  );
}
