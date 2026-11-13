"use client";
import { useRef } from "react";
import { Bell, LogOut, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { SimulatedBadge } from "@/components/ui/SimulatedBadge";
import { apiFetch } from "@/lib/api-client";
import { ROLE_LABEL } from "@/lib/permissions";
import { useUser } from "@/lib/user-context";
import { SearchLottie } from "./SearchLottie";
import { HeaderArt } from "./HeaderArt";
import { NAV } from "./nav";

export function Topbar({ menu }: { menu?: React.ReactNode }) {
  const user = useUser();
  const searchBox = useRef<HTMLLabelElement>(null);
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
    <header className="relative flex items-center gap-3 h-[84px] overflow-hidden bg-navy px-4 text-white lg:px-6">
      <HeaderArt />
      {menu}
      <span className="relative hidden rounded-xl bg-white/10 p-2 text-gold ring-1 ring-gold/60 sm:block"><PageIcon size={26} aria-hidden /></span>
      <div className="relative min-w-0 flex-1 md:max-w-[38%] md:flex-none">
        <h1 className="truncate text-lg font-bold lg:text-2xl">{page.label}</h1>
        <p className="cap hidden truncate text-xs text-white/75 sm:block">{page.subtitle}</p>
      </div>
      <div className="hidden flex-1 md:block" />
      <span className="relative"><SimulatedBadge /></span>
      <label ref={searchBox} className="relative hidden md:block">
        <span className="sr-only">Cari objek budaya, wilayah, atau program</span>
        <SearchLottie host={searchBox} />
        <input
          type="search"
          placeholder="Cari objek budaya, wilayah…"
          className="w-72 rounded-full bg-navy/70 py-2 pl-11 ring-1 ring-white/25 backdrop-blur-sm pr-4 text-sm placeholder:text-white/60 focus:outline-2 focus:outline-gold"
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
