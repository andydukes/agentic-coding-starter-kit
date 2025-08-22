import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/30 p-4">
        <DashboardSidebar userName={session.user.name ?? ""} />
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
