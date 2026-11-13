"use client";
import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

// Ikon cari animasi (Lottie): digambar saat dimuat, lalu goyang memindai tiap kali kolom di-hover/fokus.
// `host` = elemen pembungkus yang didengarkan (label pencarian).
export function SearchLottie({ host, size = 22 }: { host: React.RefObject<HTMLElement | null>; size?: number }) {
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let dead = false, anim: AnimationItem | null = null;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = host.current;
    const replay = () => { if (anim?.isPaused) anim.goToAndPlay(0, true); };
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (dead || !box.current) return;
      anim = lottie.loadAnimation({
        container: box.current, renderer: "svg", loop: false, autoplay: !still,
        path: "/brand/search.lottie.json", rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      if (still) anim.addEventListener("DOMLoaded", () => anim?.goToAndStop(89, true));
      else { el?.addEventListener("mouseenter", replay); el?.addEventListener("focusin", replay); }
    });
    return () => { dead = true; el?.removeEventListener("mouseenter", replay); el?.removeEventListener("focusin", replay); anim?.destroy(); };
  }, [host]);

  return <span ref={box} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 block -translate-y-1/2" style={{ width: size, height: size }} />;
}
