"use client";

import type { Model } from "@/lib/types";
import Link from "next/link";

export function ModelDetail({ model }: { model: Model }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">
          {model.attributes.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {model.attributes.description}
        </p>
      </header>

      <section className="space-y-2 text-sm">
        <div>
          <span className="font-medium">ID:</span> {model.id}
        </div>
        <div>
          <span className="font-medium">Model ID:</span> {model.modelId}
        </div>
      </section>

      {/* Attributes details */}
      <section className="space-y-3">
        <div className="text-base font-semibold">Attributes</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="border rounded-md p-3">
            <div className="font-medium mb-1">Name</div>
            <div className="text-muted-foreground">{model.attributes.name}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="font-medium mb-1">Publisher</div>
            <div className="text-muted-foreground">{model.attributes.publisher}</div>
          </div>
          <div className="md:col-span-2 border rounded-md p-3">
            <div className="font-medium mb-1">Description</div>
            <div className="text-muted-foreground">{model.attributes.description}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="font-medium mb-1">Publish Date</div>
            <div className="text-muted-foreground">{model.attributes["publish-date"]}</div>
          </div>
        </div>
      </section>

      {/* Metadata section with clickable cards */}
      <section className="space-y-3">
        <div className="text-base font-semibold">Metadata</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href={`/models/${model.id}/prediction`} className="border rounded-md p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="text-sm font-medium mb-1">Prediction</div>
            <div className="text-sm text-muted-foreground">
              View prediction metadata for this model.
            </div>
          </Link>
          <Link href={`/models/${model.id}/attributes`} className="border rounded-md p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="text-sm font-medium mb-1">Attributes</div>
            <div className="text-sm text-muted-foreground">
              View attributes metadata for this model.
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
