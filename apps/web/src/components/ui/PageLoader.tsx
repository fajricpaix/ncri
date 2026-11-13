"use client";
import { useEffect, useRef } from "react";

// Loader Lottie di tengah section saat halaman/bagian sedang memuat (memakai ikon NCRI, berulang).
export function PageLoader({ label = "Memuat…" }: { label?: string }) {
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let dead = false;
    let destroy = () => {};
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (dead || !box.current) return;
      const a = lottie.loadAnimation({
        container: box.current, renderer: "svg", loop: !still, autoplay: !still,
        path: "/brand/ncri-icon.lottie.json", rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      if (still) a.addEventListener("DOMLoaded", () => a.goToAndStop(149, true));
      destroy = () => a.destroy();
    });
    return () => { dead = true; destroy(); };
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 py-8">
      <span ref={box} aria-hidden className="block h-24 w-28 rounded-2xl bg-navy p-3 shadow-lg ring-1 ring-gold/40" />
      <span className="cap text-sm text-slate-500">{label}</span>
    </div>
  );
}
