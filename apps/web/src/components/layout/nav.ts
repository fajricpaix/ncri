import {
  LayoutDashboard, Map, Landmark, TrendingUp, ShieldAlert,
  Lightbulb, Bot, Database, FileText, Settings, type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; subtitle: string; about?: string }[] = [
  { href: "/", label: "Beranda (National Dashboard)", icon: LayoutDashboard, subtitle: "Gambaran menyeluruh kondisi dan risiko keberlangsungan budaya Indonesia" },
  { href: "/cultural-risk-assessment", label: "Cultural Risk Assessment", icon: ShieldAlert, subtitle: "Sinyal perubahan indikator yang perlu diperiksa dan ditinjau", about: "Penilaian risiko tiap objek budaya beserta faktor penyebabnya. Gunakan untuk memeriksa mengapa suatu objek berisiko tinggi dan objek mana yang perlu ditinjau lebih dulu." },
  { href: "/ai-predictive-risk-engine", label: "AI Predictive Risk Engine", icon: TrendingUp, subtitle: "Tren indikator dan prediksi risiko (menunggu validasi data historis)", about: "Tren indikator dan prediksi risiko ke depan. Saat ini skor yang tampil adalah baseline nyata, sedangkan probabilitas dan proyeksi baru ditampilkan setelah model divalidasi dengan data historis." },
  { href: "/risk-mapping-gis", label: "Risk Mapping (GIS)", icon: Map, subtitle: "Pemetaan geospasial risiko keberlangsungan warisan budaya per provinsi", about: "Peta risiko per provinsi dengan filter tingkat risiko. Klik sebuah provinsi untuk melihat objek budaya dan rekomendasi di wilayah itu." },
  { href: "/cultural-repository", label: "Cultural Repository", icon: Landmark, subtitle: "Direktori objek budaya, riwayat indikator, dan penilaian risikonya", about: "Direktori seluruh objek budaya: daftar, per jenis budaya, per provinsi, dan kualitas data. Cari dan filter, lalu buka detail objek untuk melihat riwayat indikator dan penilaian risikonya." },
  { href: "/recommendations", label: "Recommendation Engine", icon: Lightbulb, subtitle: "Hipotesis akar masalah dan draft rekomendasi untuk ditinjau manusia", about: "Hipotesis akar masalah dan draft rekomendasi dari analisis AI. Semua keluaran berstatus draft sampai ditinjau dan disetujui reviewer manusia." },
  { href: "/data-sources", label: "Data Submission", icon: Database, subtitle: "Sumber data, import CSV, dan kualitas data", about: "Tempat mengunggah data CSV dan melihat sumber data. Unggahan divalidasi dulu dan error ditampilkan sebagai pratinjau, baru diimpor setelah dikonfirmasi." },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot, subtitle: "Tanya jawab berbasis data NCRI, dengan bukti dan batasan", about: "Tanya jawab berbasis data NCRI. Jawaban disertai bukti dari data dan batasannya; asisten tidak menjawab di luar data yang tersedia." },
  { href: "/reports", label: "Reports", icon: FileText, subtitle: "Laporan eksekutif nasional dan daerah, ekspor CSV dan PDF", about: "Laporan eksekutif nasional atau per provinsi yang bisa dicetak sebagai PDF, serta ekspor CSV daftar objek dan peringatan dini." },
  { href: "/settings", label: "Settings", icon: Settings, subtitle: "Pengguna, role, dan jejak audit", about: "Khusus admin: kelola pengguna dan role, atur penyedia LLM, dan lihat jejak audit aktivitas." },
];

// Penjelasan untuk subhalaman yang bukan menu sendiri (kunci = path persis)
export const ABOUT_EXTRA: Record<string, string> = {
  "/cultural-risk-assessment/early-warnings": "Daftar peringatan dini: perubahan indikator yang tajam atau data yang perlu diverifikasi. Tinjau tiap peringatan lalu tandai statusnya.",
};
