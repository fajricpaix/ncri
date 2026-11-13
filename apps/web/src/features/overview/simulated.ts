// DATA CONTOH (SIMULATED): modul yang sumber datanya belum ada di sistem (pelaku, komunitas, program, dampak).
// Semua angka di sini karangan untuk menunjukkan layout; ganti dengan API saat modul programnya dibangun.
export const SIM = {
  kpis: {
    pelaku: { value: 1284, delta: 3.1 },
    komunitas: { value: 37, delta: 2.8 },
    program: { value: 24, delta: 9.1 },
    indeks: { value: 63.4, delta: 1.6 }, // Indeks Keberlangsungan NCRI (belum punya metodologi)
  },
  programStatus: [
    { label: "Selesai", value: 7, color: "#2e9e5b" },
    { label: "Berjalan", value: 11, color: "#2f6fd6" },
    { label: "Perencanaan", value: 4, color: "#e8a317" },
    { label: "Tertunda", value: 2, color: "#8a94a6" },
  ],
  impact: [
    { label: "Pelaku Aktif", before: 1012, after: 1284 },
    { label: "Aktivitas Budaya per Tahun", before: 312, after: 408 },
    { label: "Komunitas Aktif", before: 29, after: 37 },
  ],
};
