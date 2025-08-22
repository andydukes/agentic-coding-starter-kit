"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage(page - 1)}>
        Prev
      </Button>
      <div>
        Page {page} of {totalPages}
      </div>
      <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage(page + 1)}>
        Next
      </Button>
      <div className="text-muted-foreground">· {total} total</div>
    </div>
  );
}
