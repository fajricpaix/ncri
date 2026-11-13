import {
  LayoutDashboard, Map, Landmark, TrendingUp, ShieldAlert,
  Lightbulb, Bot, Database, FileText, Settings, type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; subtitle: string }[] = [
  { href: "/", label: "Beranda (Dashboard)", icon: LayoutDashboard, subtitle: "Gambaran menyeluruh kondisi dan risiko keberlangsungan budaya Indonesia" },
  { href: "/cultural-risk-assessment", label: "Cultural Risk Assessment", icon: ShieldAlert, subtitle: "Sinyal perubahan indikator yang perlu diperiksa dan ditinjau" },
  { href: "/ai-predictive-risk-engine", label: "AI Predictive Risk Engine", icon: TrendingUp, subtitle: "Tren indikator dan prediksi risiko (menunggu validasi data historis)" },
  { href: "/risk-mapping-gis", label: "Risk Mapping (GIS)", icon: Map, subtitle: "Pemetaan geospasial risiko keberlangsungan warisan budaya per provinsi" },
  { href: "/cultural-objects", label: "Cultural Repository", icon: Landmark, subtitle: "Direktori objek budaya, riwayat indikator, dan penilaian risikonya" },
  { href: "/recommendations", label: "Recommendation Engine", icon: Lightbulb, subtitle: "Hipotesis akar masalah dan draft rekomendasi untuk ditinjau manusia" },
  { href: "/data-sources", label: "Data Submission", icon: Database, subtitle: "Sumber data, import CSV, dan kualitas data" },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot, subtitle: "Tanya jawab berbasis data NCRI, dengan bukti dan batasan" },
  { href: "/reports", label: "Reports", icon: FileText, subtitle: "Laporan eksekutif nasional dan daerah, ekspor CSV dan PDF" },
  { href: "/settings", label: "Settings", icon: Settings, subtitle: "Pengguna, role, dan jejak audit" },
];
