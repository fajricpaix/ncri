"use client";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { apiFetch } from "@/lib/api-client";
import { ROLE_LABEL } from "@/lib/permissions";
import { useUser } from "@/lib/user-context";

export function Topbar({ menu }: { menu?: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-3 bg-navy px-4 py-3 text-white lg:px-6">
      {menu}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold lg:text-xl">National Cultural Risk Intelligence</h1>
        <p className="hidden text-xs text-white/70 sm:block">Predicting Cultural Decline Before It Disappears</p>
      </div>
      <SimulatedBadge />
      <label className="relative hidden md:block">
        <span className="sr-only">Cari objek budaya, wilayah, atau program</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" aria-hidden />
        <input
          type="search"
          placeholder="Cari objek budaya, wilayah…"
          className="w-72 rounded-full bg-white/10 py-2 pl-9 pr-4 text-sm placeholder:text-white/60 focus:outline-2 focus:outline-gold"
        />
      </label>
      <button aria-label="Notifikasi" className="rounded-full p-2 hover:bg-white/10">
        <Bell size={20} />
      </button>
      <div className="flex items-center gap-2 text-sm">
        <UserCircle size={30} aria-hidden />
        <span className="hidden leading-tight lg:block">
          <span className="block font-semibold">{user.name}</span>
          <span className="block text-xs text-white/70">{ROLE_LABEL[user.role]}</span>
        </span>
      </div>
      <button onClick={logout} aria-label="Keluar" title="Keluar" className="rounded-full p-2 hover:bg-white/10">
        <LogOut size={20} />
      </button>
    </header>
  );
}
