import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attributeDefinitions, endpointOperations } from "@/lib/schema";
import type { DomainCategorical, DomainReal } from "@/lib/types";

export type LastValueSource = "endpoint" | "webhook" | "manual";

export type SetLastValueInput = {
  attributeDefinitionId: string;
  payload: unknown; // could be number|string|object
  source: LastValueSource;
  responseId?: string; // provenance id
  extractOverridePath?: string; // optional override for extraction
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isDomainR(domain: unknown): domain is DomainReal {
  if (!isRecord(domain)) return false;
  if (domain.type === "DomainR") return true;
  const lower = domain.lower;
  const upper = domain.upper;
  return typeof lower === "number" && typeof upper === "number";
}

function isDomainC(domain: unknown): domain is DomainCategorical {
  if (!isRecord(domain)) return false;
  if (domain.type === "DomainC") return true;
  return Array.isArray((domain as { values?: unknown }).values);
}

function extractScalarFromObject(obj: unknown, path?: string): { numberValue?: number; textValue?: string; meta?: Record<string, unknown> } {
  if (!obj || typeof obj !== "object") return {};
  if (!path) return { meta: { note: "no extract path configured" } };
  // Minimal JSON Pointer support for paths like /foo/bar
  if (!path.startsWith("/")) return { meta: { error: "unsupported path format" } };
  let cursor: any = obj;
  for (const part of path.split("/").slice(1)) {
    const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cursor && typeof cursor === "object" && key in cursor) cursor = cursor[key];
    else return { meta: { error: "path not found", at: part } };
  }
  if (typeof cursor === "number") return { numberValue: cursor };
  if (typeof cursor === "string") return { textValue: cursor };
  return { meta: { error: "extracted non-scalar" } };
}

export async function setLastValue(input: SetLastValueInput) {
  const { attributeDefinitionId, payload, source, responseId, extractOverridePath } = input;
  // Load attribute + operation for extraction config
  const rows = await db
    .select({
      id: attributeDefinitions.id,
      domain: attributeDefinitions.domain,
      operationId: attributeDefinitions.operationId,
    })
    .from(attributeDefinitions)
    .where(eq(attributeDefinitions.id, attributeDefinitionId))
    .limit(1);

  const attr = rows[0];
  if (!attr) throw new Error("AttributeDefinition not found");

  let numberValue: number | null = null;
  let textValue: string | null = null;
  let objectValue: Record<string, unknown> | unknown[] | null = null;
  const meta: Record<string, unknown> = {};

  // If payload is object, store and try extraction
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload)) objectValue = payload;
    else if (isRecord(payload)) objectValue = payload as Record<string, unknown>;
    // fetch extraction config
    let extractPath = extractOverridePath;
    if (!extractPath && attr.operationId) {
      const ops = await db
        .select({ path: endpointOperations.responseExtractPath, fmt: endpointOperations.responseExtractFormat })
        .from(endpointOperations)
        .where(eq(endpointOperations.id, attr.operationId))
        .limit(1);
      extractPath = ops[0]?.path ?? undefined;
      if (ops[0]?.fmt) meta.extractFormat = ops[0]?.fmt;
    }
    const extracted = extractScalarFromObject(payload, extractPath);
    Object.assign(meta, extracted.meta);
    if (typeof extracted.numberValue === "number") numberValue = extracted.numberValue;
    if (typeof extracted.textValue === "string") textValue = extracted.textValue;
  } else if (typeof payload === "number") {
    numberValue = payload;
  } else if (typeof payload === "string") {
    textValue = payload;
  }

  // Domain validation
  if (isDomainR(attr.domain)) {
    if (numberValue == null && textValue != null) {
      const parsed = Number(textValue);
      if (!Number.isNaN(parsed)) numberValue = parsed;
    }
    if (numberValue == null) throw new Error("DomainR requires numeric lastValue");
    // bounds
    if (numberValue < attr.domain.lower || numberValue > attr.domain.upper) {
      throw new Error("DomainR value out of bounds");
    }
    // discrete step
    if (attr.domain.discrete && attr.domain.interval) {
      const off = Math.abs((numberValue - attr.domain.lower) % attr.domain.interval);
      if (off > 1e-9 && Math.abs(off - attr.domain.interval) > 1e-9) {
        meta.rounded = true;
        numberValue = Math.round((numberValue - attr.domain.lower) / attr.domain.interval) * attr.domain.interval + attr.domain.lower;
      }
    }
  } else if (isDomainC(attr.domain)) {
    if (textValue == null && typeof numberValue === "number") textValue = String(numberValue);
    if (textValue == null) throw new Error("DomainC requires text lastValue");
    if (!attr.domain.values.includes(textValue)) {
      throw new Error("DomainC value not in domain values");
    }
  }

  await db
    .update(attributeDefinitions)
    .set({
      // Drizzle numeric maps to string; persist as string
      lastValueNumber: numberValue != null ? String(numberValue) : null,
      lastValueText: textValue ?? null,
      lastValueObject: objectValue,
      lastValueSource: source,
      lastValueUpdatedAt: new Date(),
      lastResponseId: responseId ?? null,
      lastValueMeta: Object.keys(meta).length ? meta : null,
    })
    .where(eq(attributeDefinitions.id, attributeDefinitionId));
}
