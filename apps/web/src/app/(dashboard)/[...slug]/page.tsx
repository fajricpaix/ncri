import { NAV } from "@/components/layout/nav";
import { Card } from "@/components/ui/Card";

export function generateStaticParams() {
  return NAV.filter((n) => n.href !== "/" && !["/cultural-objects", "/data-sources", "/early-warnings", "/recommendations", "/settings", "/risk-map", "/reports", "/analytics"].includes(n.href)).map((n) => ({ slug: [n.href.slice(1)] }));
}

export default async function Placeholder({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const item = NAV.find((n) => n.href === `/${slug[0]}`);
  return (
    <Card title={item?.label ?? "Halaman"}>
      <p className="text-sm text-slate-600">Modul ini dikerjakan di sprint berikutnya.</p>
    </Card>
  );
}
