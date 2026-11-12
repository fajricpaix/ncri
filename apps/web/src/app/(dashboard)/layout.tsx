import { Suspense } from "react";
import { ApiStatus } from "@/components/layout/ApiStatus";
import { Shell } from "@/components/layout/Shell";
import { getMe } from "@/lib/api-server";
import { UserProvider } from "@/lib/user-context";

async function Authed({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  return (
    <UserProvider user={user}>
      <Shell
        footer={
          <Suspense fallback="memeriksa API…">
            <ApiStatus />
          </Suspense>
        }
      >
        {children}
      </Shell>
    </UserProvider>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-navy" />}>
      <Authed>{children}</Authed>
    </Suspense>
  );
}
