// Aman dipakai di client component. Sesi = cookie httpOnly dari API; JS tidak pernah memegang token.
export const API = process.env.NEXT_PUBLIC_API_BASE_URL;

/** fetch ke API dengan cookie sesi + header anti-CSRF (wajib untuk POST/PATCH/DELETE). */
export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("X-NCRI-Client", "web");
  if (typeof init.body === "string") headers.set("content-type", "application/json");
  return fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
}
