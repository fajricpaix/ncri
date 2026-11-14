"use client";
import { AnimatedLogo } from "@/components/layout/AnimatedLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCan } from "@/lib/user-context";
import { NAV } from "@/components/layout/nav";
import { SidebarArt } from "@/components/layout/SidebarArt";

// "Beranda (National Dashboard)" -> baris 1 "Beranda", baris 2 "(National Dashboard)"
const splitLabel = (l: string) => { const i = l.indexOf(" ("); return i < 0 ? [l, ""] : [l.slice(0, i), l.slice(i + 1)]; };

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  const path = usePathname();
  const isAdmin = useCan("admin");
  return (
    <nav aria-label="Navigasi utama" className="relative flex h-full w-64 flex-col overflow-hidden bg-gradient-to-b from-navy to-[#0a1a33] text-white">
      <Link href="/" className="flex h-[84px] shrink-0 items-center gap-3 border-b border-r border-white/10 px-4">
        <AnimatedLogo />
        <span className="leading-tight">
          <span className="block text-xl font-extrabold tracking-wide">NCRI</span>
          <span className="block text-[11px] text-white/70">National Cultural Risk Intelligence</span>
        </span>
      </Link>
      <ul className="relative shrink-0 space-y-0.5 px-2.5 py-2.5">
        {NAV.filter((n) => isAdmin || n.href !== "/settings").map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          const [main, sub] = splitLabel(label);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 whitespace-nowrap px-2.5 py-2.5 text-[14px] font-semibold leading-tight tracking-tight ${
                  active ? "btn-gold" : "rounded-xl text-white transition-colors hover:bg-white/10"
                }`}
              >
                <Icon size={21} strokeWidth={1.75} aria-hidden className="shrink-0" />
                <span>{main}{sub && <span className="block text-[13px] font-medium">{sub}</span>}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="relative shrink-0 px-4 pb-2 text-[11px] text-white/60">{footer}</div>
      <SidebarArt path={path} />
    </nav>
  );
}
