import {
  LayoutDashboard, Map, Landmark, TrendingUp, BellRing,
  Lightbulb, Bot, Database, FileText, Settings, type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; subtitle: string }[] = [
  { href: "/", label: "Executive Overview", icon: LayoutDashboard, subtitle: "Gambaran menyeluruh kondisi dan risiko keberlangsungan budaya Indonesia" },
  { href: "/risk-map", label: "National Risk Map", icon: Map, subtitle: "Pemetaan geospasial risiko keberlangsungan warisan budaya per provinsi" },
  { href: "/cultural-objects", label: "Cultural Objects", icon: Landmark, subtitle: "Direktori objek budaya, riwayat indikator, dan penilaian risikonya" },
  { href: "/analytics", label: "Predictive Analytics", icon: TrendingUp, subtitle: "Tren indikator dan prediksi risiko (menunggu validasi data historis)" },
  { href: "/early-warnings", label: "Early Warning", icon: BellRing, subtitle: "Sinyal perubahan indikator yang perlu diperiksa dan ditinjau" },
  { href: "/recommendations", label: "Root Cause & Recommendations", icon: Lightbulb, subtitle: "Hipotesis akar masalah dan draft rekomendasi untuk ditinjau manusia" },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot, subtitle: "Tanya jawab berbasis data NCRI (belum tersedia)" },
  { href: "/data-sources", label: "Data Sources", icon: Database, subtitle: "Sumber data, import CSV, dan kualitas data" },
  { href: "/reports", label: "Reports", icon: FileText, subtitle: "Laporan eksekutif nasional dan daerah, ekspor CSV dan PDF" },
  { href: "/settings", label: "Settings", icon: Settings, subtitle: "Pengguna, role, dan jejak audit" },
];
