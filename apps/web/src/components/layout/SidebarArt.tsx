// Ilustrasi berlapis di dasar sidebar (dekoratif). Tumpukan: batik-back -> landmark (ganti per halaman) -> batik-front.
// Landmark = foto/ilustrasi selebar 816px (transparan ATAU persegi), dasar bangunan di tepi bawah file (dipasang 17% dari dasar sidebar,
// tersembunyi di balik gelombang batik depan). Tepi atas/kiri/kanan dilembutkan lewat mask dan diberi kabut navy, jadi foto persegi pun menyatu. Cara bikin dari foto: scripts/make_sidebar_assets.py.
// Tambah halaman baru: taruh file di public/brand/sidebar/landmark/ lalu buka komentar barisnya di bawah.
import Image from "next/image";

const DIR = "/brand/sidebar";
// Landmark per menu (keputusan 13 Nov 2026). v1 = ilustrasi vektor buatan skrip (scripts/build-sidebar-art.mjs); ganti file kapan saja.
const LANDMARK: Record<string, { src: string; w: number; h: number }> = {
  "/": { src: `${DIR}/landmark/borobudur.webp`, w: 816, h: 700 }, // Borobudur (beranda; cocok persis, bukan awalan)
  "/cultural-risk-assessment": { src: `${DIR}/landmark/tongkonan.webp`, w: 816, h: 700 }, // Rumah Tongkonan Toraja
  "/ai-predictive-risk-engine": { src: `${DIR}/landmark/pinisi.webp`, w: 816, h: 700 }, // Kapal Pinisi Bugis
  "/risk-mapping-gis": { src: `${DIR}/landmark/bratan.webp`, w: 816, h: 700 }, // Pura Ulun Danu Bratan, Bali
  "/recommendations": { src: `${DIR}/landmark/tenun.webp`, w: 816, h: 700 }, // Alat tenun songket
  "/data-sources": { src: `${DIR}/landmark/lontar.webp`, w: 816, h: 700 }, // Naskah lontar
  "/ai-assistant": { src: `${DIR}/landmark/garuda.webp`, w: 816, h: 700 }, // Garuda
  "/reports": { src: `${DIR}/landmark/monas.webp`, w: 816, h: 700 }, // Monumen Nasional (Monas)
  "/settings": { src: `${DIR}/landmark/gapura.webp`, w: 816, h: 700 }, // Gapura candi bentar Bali
  "/early-warnings": { src: `${DIR}/landmark/tongkonan.webp`, w: 816, h: 700 }, // bagian dari Cultural Risk Assessment
  "/cultural-repository": { src: `${DIR}/landmark/cultural-repository.webp`, w: 816, h: 700 }, // Cultural Repository
};

// atas memudar ke navy, sisi kiri/kanan sedikit; bawah tegas (disembunyikan batik depan)
const FEATHER: React.CSSProperties = {
  maskImage: "linear-gradient(to bottom, transparent 0, #000 42%), linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)",
  maskComposite: "intersect",
  WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 42%), linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)",
  WebkitMaskComposite: "source-in",
};

export function SidebarArt({ path }: { path: string }) {
  const key = Object.keys(LANDMARK).find((k) => (k === "/" ? path === "/" : path.startsWith(k)));
  const lm = key ? LANDMARK[key] : undefined;
  return (
    <div aria-hidden className="pointer-events-none relative hidden min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_22%)] [@media(min-height:720px)]:block">
      {/* lebar penuh sidebar, menempel di dasar; kalau ruangnya kurang, bagian atas yang terpotong */}
      <div className="absolute inset-x-0 bottom-0 aspect-[816/1295]">
        <Image src={`${DIR}/batik-back.webp`} alt="" fill sizes="256px" unoptimized priority />
        {lm && (
          <div key={lm.src} className="absolute inset-x-0 bottom-[17%] animate-[art-fade_.6s_ease-out]" style={FEATHER}>
            <Image src={lm.src} alt="" width={lm.w} height={lm.h} unoptimized priority className="block h-auto w-full saturate-[.88]" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/20 to-transparent" />
          </div>
        )}
        <Image src={`${DIR}/batik-front.webp`} alt="" fill sizes="256px" unoptimized priority />
      </div>
    </div>
  );
}
