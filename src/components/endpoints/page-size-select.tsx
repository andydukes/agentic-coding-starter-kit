"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [10, 20, 50, 100];

export function PageSizeSelect({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    // reset to first page when page size changes
    params.delete("page");
    params.set("pageSize", String(value));
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Page size</span>
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
