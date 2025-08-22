"use client";

import type { Model } from "@/lib/types";

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

      {/* Metadata section with non-clickable placeholders */}
      <section className="space-y-3">
        <div className="text-base font-semibold">Metadata</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-md p-4 bg-muted/20">
            <div className="text-sm font-medium mb-1">Prediction</div>
            <div className="text-sm text-muted-foreground">
              This area will show metadata.prediction. (Non-clickable placeholder)
            </div>
          </div>
          <div className="border rounded-md p-4 bg-muted/20">
            <div className="text-sm font-medium mb-1">Attributes</div>
            <div className="text-sm text-muted-foreground">
              This area will show metadata.attributes. (Non-clickable placeholder)
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
