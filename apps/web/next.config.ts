import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Produksi: browser memanggil /api/v1 (same-origin) dan Vercel meneruskannya ke API. Cookie sesi jadi first-party,
  // jadi proxy.ts bisa membacanya. Kosong (dev lokal) = tanpa rewrite.
  async rewrites() {
    const target = process.env.API_SERVER_URL;
    return target ? [{ source: "/api/v1/:path*", destination: `${target}/:path*` }] : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
