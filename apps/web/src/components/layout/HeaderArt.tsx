// Latar header: foto Borobudur (public/brand/header-art.jpg, 2928x280). Dekoratif murni.
// Foto ditempatkan di ~78% sisi kanan dan memudar ke navy di kiri, supaya candi jatuh di antara judul dan kolom pencarian.
import Image from "next/image";

export function HeaderArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[78%] [mask-image:linear-gradient(to_right,transparent,#000_28%)]">
      <Image src="/brand/header-art.jpg" alt="" fill sizes="80vw" unoptimized priority className="object-cover object-[50%_55%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-navy/45" />
    </div>
  );
}
