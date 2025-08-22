"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Model } from "@/lib/types";

export function ModelsList({ models }: { models: Model[] }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.length === 0 ? (
        <div className="col-span-full border rounded-lg p-8 text-center space-y-3">
          <div className="text-lg font-medium">No models yet</div>
          <p className="text-sm text-muted-foreground">
            Add some sample models to get started.
          </p>
          <div>
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/models/seed", { method: "POST" });
                  if (!res.ok) throw new Error("Seed failed");
                  router.refresh();
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Adding…" : "Add sample models"}
            </Button>
          </div>
        </div>
      ) : (
        models.map((m) => (
          <div key={m.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold leading-tight">{m.attributes.name}</h3>
                {m.attributes.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {m.attributes.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2">
                <span className="font-medium">Model ID:</span> {m.modelId}
              </div>
              <Link href={`/models/${m.id}`}>
                <Button variant="outline" size="sm">View details</Button>
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
