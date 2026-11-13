import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API as PUBLIC_API } from "./api-client";
import type { User } from "./permissions";

/** fetch dari Server Component: meneruskan cookie sesi; 401 -> /login. */
// Server tidak bisa memakai base relatif ("/api/v1"), jadi produksi mengisi API_SERVER_URL (URL absolut ke API).
const API = process.env.API_SERVER_URL ?? PUBLIC_API;

export async function serverFetch(path: string): Promise<Response> {
  const jar = await cookies();
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { cookie: jar.toString() },
  });
  if (res.status === 401) redirect("/login");
  return res;
}

export async function api<T>(path: string): Promise<T> {
  const r = await serverFetch(path);
  if (r.status === 403) throw new Error("Anda tidak berwenang melihat data ini");
  if (!r.ok) throw new Error(`API ${r.status} ${path}`);
  return r.json();
}

export async function getMe(): Promise<User> {
  const r = await serverFetch("/auth/me");
  if (!r.ok) redirect("/login");
  return r.json();
}
