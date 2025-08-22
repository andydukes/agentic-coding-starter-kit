"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchInput({ placeholder = "Search endpoints..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>(searchParams?.get("q") ?? "");
  const debounced = useDebouncedValue(value, 300);

  useEffect(() => {
    setValue(searchParams?.get("q") ?? "");
  }, [searchParams]);

  function applyQuery(next: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    // Reset page when searching
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  // Debounced navigation on input change
  useEffect(() => {
    if (debounced === (searchParams?.get("q") ?? "")) return; // avoid redundant push
    applyQuery((debounced || "").trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex items-center gap-2">
      <input
        className="h-9 w-[260px] rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyQuery(value.trim());
        }}
      />
      <Button
        variant="ghost"
        type="button"
        disabled={!value}
        onClick={() => {
          setValue("");
          applyQuery("");
        }}
      >
        Clear
      </Button>
      <Button variant="secondary" onClick={() => applyQuery(value.trim())}>
        Search
      </Button>
    </div>
  );
}
