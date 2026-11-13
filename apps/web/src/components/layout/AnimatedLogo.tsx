"use client";
import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

// Ikon NCRI animasi (Lottie). Main sekali saat dimuat, ulang saat hover/fokus/klik.
export function AnimatedLogo({ width = 52 }: { width?: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const anim = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let dead = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (dead || !box.current) return;
      anim.current = lottie.loadAnimation({
        container: box.current, renderer: "svg", loop: false, autoplay: !still,
        path: "/brand/ncri-icon.lottie.json", rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      if (still) anim.current.addEventListener("DOMLoaded", () => anim.current?.goToAndStop(149, true));
    });
    return () => { dead = true; anim.current?.destroy(); };
  }, []);

  const replay = () => {
    const a = anim.current;
    if (a && a.isPaused) a.goToAndPlay(0, true); // jangan potong animasi yang sedang jalan
  };

  return (
    <span
      ref={box}
      role="img"
      aria-label="NCRI"
      onMouseEnter={replay}
      onFocus={replay}
      onClick={replay}
      style={{ width, height: width * 628 / 738 }}
      className="block shrink-0"
    />
  );
}
