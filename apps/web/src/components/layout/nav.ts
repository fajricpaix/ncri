import {
  LayoutDashboard, Map, Landmark, TrendingUp, BellRing,
  Lightbulb, Bot, Database, FileText, Settings, type LucideIcon,
} from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/risk-map", label: "National Risk Map", icon: Map },
  { href: "/cultural-objects", label: "Cultural Objects", icon: Landmark },
  { href: "/analytics", label: "Predictive Analytics", icon: TrendingUp },
  { href: "/early-warnings", label: "Early Warning", icon: BellRing },
  { href: "/recommendations", label: "Root Cause & Recommendations", icon: Lightbulb },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];
