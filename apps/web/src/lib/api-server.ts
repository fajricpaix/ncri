import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API } from "./api-client";
import type { User } from "./permissions";

/** fetch dari Server Component: meneruskan cookie sesi; 401 -> /login. */
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
