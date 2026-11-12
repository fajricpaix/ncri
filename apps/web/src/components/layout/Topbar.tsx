"use client";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { apiFetch } from "@/lib/api-client";
import { ROLE_LABEL } from "@/lib/permissions";
import { useUser } from "@/lib/user-context";
import { HeaderArt } from "./HeaderArt";
import { NAV } from "./nav";

export function Topbar({ menu }: { menu?: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();
  const path = usePathname();
  const page = NAV.filter((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)))[0] ?? NAV[0];
  const PageIcon = page.icon;

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative flex items-center gap-3 overflow-hidden bg-navy px-4 py-3 text-white lg:px-6">
      <HeaderArt />
      {menu}
      <span className="relative hidden rounded-xl bg-white/10 p-2 text-gold ring-1 ring-gold/60 sm:block"><PageIcon size={26} aria-hidden /></span>
      <div className="relative min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold lg:text-2xl">{page.label}</h1>
        <p className="hidden truncate text-xs text-white/75 sm:block">{page.subtitle}</p>
      </div>
      <span className="relative"><SimulatedBadge /></span>
      <label className="relative hidden md:block">
        <span className="sr-only">Cari objek budaya, wilayah, atau program</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" aria-hidden />
        <input
          type="search"
          placeholder="Cari objek budaya, wilayah…"
          className="w-72 rounded-full bg-white/10 py-2 pl-9 pr-4 text-sm placeholder:text-white/60 focus:outline-2 focus:outline-gold"
        />
      </label>
      <button aria-label="Notifikasi" className="relative rounded-full p-2 hover:bg-white/10">
        <Bell size={20} />
      </button>
      <div className="relative flex items-center gap-2 text-sm">
        <UserCircle size={30} aria-hidden />
        <span className="hidden leading-tight lg:block">
          <span className="block font-semibold">{user.name}</span>
          <span className="block text-xs text-white/70">{ROLE_LABEL[user.role]}</span>
        </span>
      </div>
      <button onClick={logout} aria-label="Keluar" title="Keluar" className="relative rounded-full p-2 hover:bg-white/10">
        <LogOut size={20} />
      </button>
    </header>
  );
}
