"use client";
import { Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { PageIntro } from "./PageIntro";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell({ footer, children }: { footer: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell flex h-dvh">
      <div className="app-sidebar hidden lg:block">
        <Suspense fallback={<div className="h-full w-64 bg-navy" />}><Sidebar footer={footer} /></Suspense>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden" onClick={() => setOpen(false)}>
          <Suspense fallback={<div className="h-full w-64 bg-navy" />}><Sidebar footer={footer} /></Suspense>
          <div className="flex-1 bg-black/50" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="app-topbar"><Topbar
          menu={
            <button aria-label="Buka menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden">
              <Menu size={22} />
            </button>
          }
        /></div>
        <main className="app-main flex-1 overflow-y-auto p-4 lg:p-6"><PageIntro />{children}</main>
      </div>
    </div>
  );
}
