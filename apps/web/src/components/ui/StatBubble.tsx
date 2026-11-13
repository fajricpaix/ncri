"use client";
import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import { TONE, type Tone } from "./stat-tone";

// Gelembung ikon animasi (Lottie). Ikon dikirim sebagai children (elemen dari server). Diputar ulang saat kartu ([data-stat]) di-hover.
export function StatBubble({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let dead = false, anim: AnimationItem | null = null;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const card = box.current?.closest("[data-stat]");
    const replay = () => { if (anim?.isPaused) anim.goToAndPlay(0, true); };
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (dead || !box.current) return;
      anim = lottie.loadAnimation({
        container: box.current, renderer: "svg", loop: false, autoplay: !still,
        path: `/brand/stat-${tone}.lottie.json`, rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      if (still) anim.addEventListener("DOMLoaded", () => anim?.goToAndStop(74, true));
      else card?.addEventListener("mouseenter", replay);
    });
    return () => { dead = true; card?.removeEventListener("mouseenter", replay); anim?.destroy(); };
  }, [tone]);

  const c = TONE[tone];
  return (
    <span className="relative size-[72px] shrink-0" style={{ color: c.icon }}>
      <span aria-hidden className="absolute inset-[7px] rounded-full" style={{ background: c.bg }} />
      <span ref={box} aria-hidden className="absolute inset-0" />
      <span className="stat-pop absolute left-1/2 top-1/2 -ml-3.5 -mt-3.5 size-7">{children}</span>
    </span>
  );
}
