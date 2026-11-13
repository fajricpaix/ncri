"use client";
import { AnimatedLogo } from "./AnimatedLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCan } from "@/lib/user-context";
import { NAV } from "./nav";
import { SidebarArt } from "./SidebarArt";

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  const path = usePathname();
  const isAdmin = useCan("admin");
  return (
    <nav aria-label="Navigasi utama" className="relative flex h-full w-64 flex-col overflow-hidden bg-navy text-white">
      <SidebarArt path={path} />
      <Link href="/" className="flex items-center gap-3 h-[84px] shrink-0 border-b border-r border-white/10 px-4">
        <AnimatedLogo />
        <span className="leading-tight">
          <span className="block text-xl font-extrabold tracking-wide">NCRI</span>
          <span className="block text-[11px] text-white/70">National Cultural Risk Intelligence</span>
        </span>
      </Link>
      <ul className="relative flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.filter((n) => isAdmin || n.href !== "/settings").map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-gold text-navy" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon size={18} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="relative border-t border-white/10 bg-navy/70 p-3 text-xs text-white/70 backdrop-blur-sm">{footer}</div>
    </nav>
  );
}
