"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function DashboardSidebar({ userName }: { userName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="font-medium truncate" title={userName}>
          {userName || "User"}
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className={
            "text-sm font-medium px-2 py-1 rounded hover:bg-muted transition " +
            (pathname === "/dashboard" ? "bg-muted" : "")
          }
        >
          Models
        </Link>
        <Link
          href="/dashboard/endpoints"
          className={
            "text-sm font-medium px-2 py-1 rounded hover:bg-muted transition " +
            (pathname?.startsWith("/dashboard/endpoints") ? "bg-muted" : "")
          }
        >
          Endpoints
        </Link>
      </nav>

      <div className="mt-auto">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
