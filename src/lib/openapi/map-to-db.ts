import { db } from "@/lib/db";
import { endpointDefinitions, endpointOperations } from "@/lib/schema";
import { eq } from "drizzle-orm";

function safeString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function getInfoTitle(doc: any): string {
  return safeString(doc?.info?.title) ?? "Imported API";
}

function getServerUrl(doc: any): string | null {
  const first = Array.isArray(doc?.servers) ? doc.servers[0] : null;
  return safeString(first?.url) ?? null;
}

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

function pickJsonContentSchema(obj: any): any | null {
  const content = obj?.content;
  if (!content || typeof content !== "object") return null;
  const ct =
    content["application/json"] ||
    content["application/*+json"] ||
    content["*/*"] ||
    Object.values(content)[0];
  return (ct as any)?.schema ?? null;
}

function pickResponseSchema(responses: any): any | null {
  if (!responses || typeof responses !== "object") return null;
  const prefer = ["200", "201", "default"];
  for (const code of prefer) {
    if (responses[code]) {
      const s = pickJsonContentSchema(responses[code]);
      if (s) return s;
    }
  }
  for (const v of Object.values(responses)) {
    const s = pickJsonContentSchema(v);
    if (s) return s;
  }
  return null;
}

function extractQueryParams(parameters: any[]): any | null {
  if (!Array.isArray(parameters)) return null;
  const props: Record<string, any> = {};
  for (const p of parameters) {
    if (p?.in === "query" && p?.name) {
      props[p.name] = p.schema ?? { type: "string" };
    }
  }
  return Object.keys(props).length ? { type: "object", properties: props } : null;
}

export async function upsertOpenApiIntoDb(doc: any) {
  const name = getInfoTitle(doc);
  const baseUrl = getServerUrl(doc);

  // Find or create endpoint_definition by name
  let defId: string | null = null;
  const existing = await db
    .select({ id: endpointDefinitions.id })
    .from(endpointDefinitions)
    .where(eq(endpointDefinitions.name, name))
    .limit(1);
  if (existing[0]?.id) {
    defId = existing[0].id;
  } else {
    const newId = crypto.randomUUID();
    await db
      .insert(endpointDefinitions)
      .values({
        id: newId,
        name,
        provider: "openapi",
        baseUrlTemplate: baseUrl,
        authRef: null,
        defaultHeaders: null,
      })
      .onConflictDoNothing();
    defId = newId;
  }

  if (!defId) throw new Error("Failed to determine endpoint definition id");

  // Collect operations
  const paths = doc?.paths ?? {};
  if (!paths || typeof paths !== "object") return { endpointDefinitionId: defId, operationsInserted: 0 };

  let inserted = 0;
  for (const [path, item] of Object.entries<any>(paths)) {
    for (const method of HTTP_METHODS) {
      const op = item?.[method];
      if (!op) continue;

      const operationId = safeString(op.operationId);
      const operationName = operationId ?? `${method.toUpperCase()} ${path}`;

      const requestSchema = pickJsonContentSchema(op.requestBody);
      const responseSchema = pickResponseSchema(op.responses);
      const querySchema = extractQueryParams(op.parameters || []);

      const opId = crypto.randomUUID();
      await db
        .insert(endpointOperations)
        .values({
          id: opId,
          endpointDefinitionId: defId,
          operationName,
          httpMethod: method.toUpperCase(),
          pathTemplate: path,
          requestSchema: requestSchema ?? null,
          querySchema: querySchema ?? null,
          responseSchema: responseSchema ?? null,
          options: null,
        })
        .onConflictDoNothing({
          target: [
            endpointOperations.endpointDefinitionId,
            endpointOperations.httpMethod,
            endpointOperations.pathTemplate,
          ],
        });
      inserted++;
    }
  }

  return { endpointDefinitionId: defId, operationsInserted: inserted };
}
