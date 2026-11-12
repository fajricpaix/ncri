const API = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getStatus() {
  try {
    const r = await fetch(`${API}/health`, { cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function ApiStatus() {
  const ok = await getStatus();
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-risk-low" : "bg-risk-high"}`} aria-hidden />
      API {ok ? "terhubung" : "tidak terhubung"}
    </span>
  );
}
