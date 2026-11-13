// DATA CONTOH (SIMULATED): komunitas, kab/kota terdampak, probabilitas 36 bulan, dan tren per objek belum punya sumber data.
// Semua deterministik (hash dari id/kode) supaya stabil antar render; angka karangan, ganti dengan API saat modulnya ada.
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export const simCommunities = (code: string, nObjects: number) => (nObjects ? Math.round(nObjects * (1.4 + (hash(code) % 20) / 10)) : 0);
export const simRegencies = (nObjects: number) => Math.ceil(nObjects * 0.8);
// Probabilitas risiko tinggi 36 bulan (rumus sama dengan halaman AI Predictive Risk Engine)
export const simProb36 = (score: number) => Math.min(97, Math.round(score * 1.05 + 4));

// 5 titik tahunan berakhir di skor sekarang; kemiringan acak per objek, cenderung naik (karangan)
export function simTrend(id: string, score: number): number[] {
  const slope = ((hash(id) % 9) - 2) * 1.6; // -3.2 .. +12.8 per tahun
  return Array.from({ length: 5 }, (_, i) => Math.min(100, Math.max(0, Math.round(score - slope * (4 - i)))));
}
