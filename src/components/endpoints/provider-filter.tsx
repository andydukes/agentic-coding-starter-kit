"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProviderFilter({ providers, current }: { providers: string[]; current?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSelect = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set("provider", value);
    } else {
      params.delete("provider");
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const title = current || "All providers";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          {title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Filter by provider</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect(null)} aria-selected={!current}>
          All providers
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {providers.map((p) => (
          <DropdownMenuItem key={p} onClick={() => onSelect(p)} aria-selected={current === p}>
            {p}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
