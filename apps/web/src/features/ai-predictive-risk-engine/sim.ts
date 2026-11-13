// DATA CONTOH (SIMULATED): model prediksi BELUM ada (gerbang validasi belum lulus, lihat /analytics/prediction/status).
// Semua angka prediksi/simulasi di sini rumus karangan di atas skor baseline nyata, hanya untuk layout. Jangan dipakai sebagai hasil model.
export const HORIZON = 3; // tahun

export function projectScore(score: number) {
  const mid = (y: number) => Math.min(100, Math.round(score + y * 2.5));
  return Array.from({ length: HORIZON + 1 }, (_, y) => ({ y, mid: mid(y), lo: Math.max(0, mid(y) - y * 2), hi: Math.min(100, mid(y) + y * 2) }));
}

export const simProb = (score: number) => Math.min(97, Math.round(score * 1.05 + 4));

// Efek tiap intervensi terhadap skor proyeksi (bobot karangan).
export const LEVERS = [
  { key: "regen", label: "Regenerasi Pelaku", w: 0.45, init: 30 },
  { key: "freq", label: "Frekuensi Aktivitas", w: 0.3, init: 20 },
  { key: "comm", label: "Dukungan Komunitas", w: 0.25, init: 25 },
] as const;

export const withIntervention = (base: number, pct: Record<string, number>) =>
  Math.round(base * (1 - LEVERS.reduce((a, l) => a + l.w * (pct[l.key] ?? 0), 0) / 100));
