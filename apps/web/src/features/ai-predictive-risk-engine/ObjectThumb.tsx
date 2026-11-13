import Image from "next/image";
import { Landmark } from "lucide-react";
import manifest from "../../../public/objects/manifest.json";

// Thumbnail dari Wikipedia (scripts/fetch_object_images.py). Objek tanpa foto -> ikon.
export function ObjectThumb({ name, size = 56 }: { name: string; size?: number }) {
  const m = (manifest as Record<string, { file: string; page: string }>)[name];
  return m
    ? <Image src={m.file} alt={name} width={size} height={size} unoptimized className="shrink-0 rounded-lg object-cover ring-1 ring-slate-200" style={{ width: size, height: size }} />
    : <span aria-hidden className="grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-navy to-navy-2 text-gold" style={{ width: size, height: size }}><Landmark size={size / 2.4} /></span>;
}
