import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { model, attributeDefinitions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { Model as ModelType, DomainReal } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isDomainR(domain: unknown): domain is DomainReal {
  if (!isRecord(domain)) return false;
  if ((domain as { type?: string }).type === "DomainR") return true;
  const lower = (domain as { lower?: unknown }).lower;
  const upper = (domain as { upper?: unknown }).upper;
  return typeof lower === "number" && typeof upper === "number";
}

export default async function AttributesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) notFound();

  const { id } = await params;
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(model)
    .where(and(eq(model.id, id), eq(model.userId, userId)))
    .limit(1);

  const m = rows[0] as unknown as ModelType;
  if (!m) notFound();

  // Load normalized attribute definitions for this model
  type AttrRow = {
    id: string;
    name: string;
    question: string;
    type: string;
    domain: unknown;
    lastValueNumber: string | null;
    lastValueText: string | null;
    lastValueObject: unknown | null;
    lastValueUpdatedAt: Date | string | null;
    lastValueSource: string | null;
    endpointDefinitionId: string | null;
    operationId: string | null;
  };

  const attrs: AttrRow[] = await db
    .select({
      id: attributeDefinitions.id,
      name: attributeDefinitions.name,
      question: attributeDefinitions.question,
      type: attributeDefinitions.type,
      domain: attributeDefinitions.domain,
      lastValueNumber: attributeDefinitions.lastValueNumber,
      lastValueText: attributeDefinitions.lastValueText,
      lastValueObject: attributeDefinitions.lastValueObject,
      lastValueUpdatedAt: attributeDefinitions.lastValueUpdatedAt,
      lastValueSource: attributeDefinitions.lastValueSource,
      endpointDefinitionId: attributeDefinitions.endpointDefinitionId,
      operationId: attributeDefinitions.operationId,
    })
    .from(attributeDefinitions)
    .where(eq(attributeDefinitions.modelId, id));

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">Attributes</h1>
        <p className="text-sm text-muted-foreground">{m.attributes.name}</p>
      </header>

      {!attrs || attrs.length === 0 ? (
        <div className="border rounded-md p-6 text-sm text-muted-foreground">
          No attributes found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attrs.map((a) => {
            const domain = a.domain as unknown;
            // Format number for DomainR using interval precision when available
            let displayValue: string | null;
            if (isDomainR(domain)) {
              if (a.lastValueNumber != null) {
                const n = Number(a.lastValueNumber);
                const decimals = typeof domain.interval === "number" ? (String(domain.interval).split(".")[1]?.length ?? 0) : 2;
                displayValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(n);
              } else {
                displayValue = null;
              }
            } else {
              displayValue = a.lastValueText ?? null;
            }

            const src = (a.lastValueSource ?? "").toLowerCase();
            const srcLabel = src === "endpoint" ? "end-point" : src || "";
            const srcClasses = src === "webhook"
              ? "bg-green-100 text-green-800"
              : src === "endpoint"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-700";
            return (
              <div key={a.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.type}</div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-muted-foreground flex-1">{a.question}</div>
                  {a.operationId ? (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      linked to end-point
                    </span>
                  ) : null}
                </div>

                <div className="border rounded-md p-3 bg-muted/10">
                  <div className="text-xs font-medium mb-1">Latest</div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Value: </span>
                      <span>{displayValue ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {srcLabel ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded ${srcClasses}`}>{srcLabel}</span>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        {a.lastValueUpdatedAt ? new Date(String(a.lastValueUpdatedAt)).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                </div>

                {a.lastValueObject ? (
                  <div className="text-xs">
                    <div className="font-medium mb-1">Object payload</div>
                    <details className="rounded border bg-muted/10">
                      <summary className="cursor-pointer px-3 py-2 list-none select-none">
                        <span className="text-xs text-muted-foreground">Show details</span>
                      </summary>
                      <div className="px-3 pb-3">
                        <pre className="whitespace-pre-wrap break-words bg-muted/20 rounded p-2 overflow-x-auto">
{JSON.stringify(a.lastValueObject, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : null}

                <div className="text-xs">
                  <div className="font-medium mb-1">Domain</div>
                  <pre className="whitespace-pre-wrap break-words bg-muted/20 rounded p-2">{JSON.stringify(a.domain, null, 2)}</pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
