// Ilustrasi garis emas di dasar sidebar, satu per menu (dekoratif murni, aria-hidden).
// Overview memakai ilustrasi penari (webp); menu lain SVG bergaya sama: garis emas di atas navy.
"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import Image from "next/image";

const P = (d: string, extra?: object) => <path d={d} {...extra} />;
const C = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} />;

const ART: Record<string, React.ReactNode> = {
  "/risk-mapping-gis": (
    <>
      {[30, 52, 74].map((r) => <circle key={r} cx={143} cy={142} r={r} strokeDasharray="3 5" opacity={0.35} />)}
      {P("M40 190l50 40 10 14-16-4-44-36z")}
      {P("M110 252l60 4 4 6-62-2z")}
      {P("M120 185q24-18 46 0q8 24-14 34q-26 2-32-34z")}
      {P("M186 190l20-8 4 10-14 10 12 18-8 4-18-22z")}
      {P("M200 236l44-10 6 18-30 12-14-8z")}
      {P("M143 176c-10-14-18-22-18-34a18 18 0 0 1 36 0c0 12-8 20-18 34z")}
      {C(143, 142, 6)}
    </>
  ),
  "/cultural-objects": ( // rumah gadang
    <>
      {P("M48 206Q70 190 74 130Q82 166 100 172H156Q174 166 182 130Q186 190 208 206Z")}
      {P("M70 206v70h116v-70M96 206v70M128 206v70M160 206v70M118 276v-34h20v34")}
    </>
  ),
  "/ai-predictive-risk-engine": (
    <>
      {P("M20 280l50-70 30 36 40-64 50 98M30 296h200M30 296V150", { opacity: 0.45 })}
      {P("M30 270L80 230L120 244L170 180L226 130M208 128h18v18")}
      {[[80, 230], [120, 244], [170, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={4} />)}
    </>
  ),
  "/cultural-risk-assessment": ( // kentongan + gelombang bunyi
    <>
      {P("M70 210h110a17 17 0 0 1 0 34H70a17 17 0 0 1 0-34zM92 227h66M85 210l15-40M165 210l-15-40M80 170h90")}
      {P("M196 200q14 17 0 34M210 188q24 29 0 58M224 176q34 41 0 82M54 200q-14 17 0 34M40 188q-24 29 0 58M26 176q-34 41 0 82", { opacity: 0.6 })}
    </>
  ),
  "/recommendations": ( // pelita
    <>
      {P("M128 150c-14 20-16 30-16 40a16 16 0 0 0 32 0c0-10-2-20-16-40zM128 176c-6 8-7 12-7 16a7 7 0 0 0 14 0c0-4-1-8-7-16z")}
      {P("M96 216h64q0 30-32 40q-32-10-32-40zM160 224q22-2 22 12t-26 12M108 262h40")}
      {P("M128 118v-14M96 130l-10-10M160 130l10-10M80 170h-14M176 170h14", { opacity: 0.6 })}
    </>
  ),
  "/ai-assistant": ( // gunungan
    <>
      {P("M128 120C150 150 180 180 190 240V280H66V240C76 180 106 150 128 120ZM128 150V280")}
      {P("M128 190q-20-6-24-24M128 190q20-6 24-24M128 220q-26-6-30-30M128 220q26-6 30-30M128 250q-30-4-36-32M128 250q30-4 36-32")}
      {C(128, 106, 5)}
    </>
  ),
  "/data-sources": (
    <>
      <ellipse cx={128} cy={170} rx={46} ry={16} />
      {P("M82 170v100a46 16 0 0 0 92 0V170M82 204a46 16 0 0 0 92 0M82 238a46 16 0 0 0 92 0")}
      {P("M174 204h30M82 238H52", { opacity: 0.6 })}
      {C(208, 204, 4)}{C(48, 238, 4)}
    </>
  ),
  "/reports": (
    <>
      {P("M84 140h88v130H84zM78 140a6 6 0 0 1 0-12h100a6 6 0 0 1 0 12M100 170h56M100 190h56M100 210h40")}
      {C(156, 248, 12)}{P("M156 240l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z")}
    </>
  ),
  "/settings": ( // gerigi bergaya matahari
    <>
      {C(128, 210, 22)}{C(128, 210, 34)}
      {Array.from({ length: 12 }, (_, i) => <path key={i} d="M128 164v-14" transform={`rotate(${i * 30} 128 210)`} />)}
      {Array.from({ length: 6 }, (_, i) => <path key={i} d="M128 188q10 10 0 22q-10-12 0-22" transform={`rotate(${i * 60} 128 210)`} />)}
    </>
  ),
};

// Awan batik (mega mendung) + titik isen-isen, memberi kesan organik di belakang ilustrasi
const CLOUDS = (
  <g className="art-soft" opacity={0.4}>
    {P("M14 112c0-12 16-16 24-7c3-13 26-11 26 4c13-3 20 11 9 18H26c-11 0-15-9-12-15zM44 108a6 6 0 1 1 5 8")}
    {P("M196 70c0-10 14-14 21-6c3-11 23-9 23 3c11-3 17 9 8 15h-44c-9 0-12-7-8-12zM222 66a5 5 0 1 1 4 7")}
    {[[30, 150], [60, 140], [226, 120], [208, 150], [238, 168], [24, 176]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={1.6} />)}
  </g>
);

export function SidebarArt({ path }: { path: string }) {
  const key = Object.keys(ART).find((k) => path.startsWith(k));
  const svg = useRef<SVGSVGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);

  // pathLength=1 supaya semua bentuk bisa digambar bertahap lewat CSS
  useLayoutEffect(() => {
    svg.current?.querySelectorAll("path,circle,ellipse").forEach((e) => e.setAttribute("pathLength", "1"));
  }, [key]);

  useEffect(() => {
    let dead = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (dead || !box.current) return;
      anim.current = lottie.loadAnimation({
        container: box.current, renderer: "svg", loop: false, autoplay: !still,
        path: "/brand/sidebar-batik.lottie.json", rendererSettings: { preserveAspectRatio: "xMidYMax slice" },
      });
      if (still) anim.current.addEventListener("DOMLoaded", () => anim.current?.goToAndStop(89, true));
    });
    return () => { dead = true; anim.current?.destroy(); anim.current = null; };
  }, []);

  // pindah halaman: ulang animasi batik
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) anim.current?.goToAndPlay(0, true);
  }, [key]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[340px] [mask-image:linear-gradient(to_bottom,transparent,#000_30%)] [@media(min-height:900px)]:block">
      {key ? (
        <svg ref={svg} key={key} viewBox="0 0 256 340" className="art-draw h-full w-full fill-none stroke-gold" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" preserveAspectRatio="xMidYMax slice">
          {CLOUDS}
          <g>{ART[key]}</g>
        </svg>
      ) : (
        <Image src="/brand/sidebar-art.webp" alt="" fill sizes="256px" unoptimized className="object-cover object-bottom" />
      )}
      <div ref={box} className="absolute inset-0" />
    </div>
  );
}
