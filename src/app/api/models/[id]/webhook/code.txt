import { db } from "@/lib/db";
import { attributeDefinitions, model } from "@/lib/schema";
import { inArray, and, eq } from "drizzle-orm";
import { setLastValue } from "@/lib/last-value";

// POST /api/models/[id]/webhook
export async function POST(req: Request, ctx: { params: { id: string } }) {
  function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
  }
  type InputItem = { name: string; value: unknown };
  type BodyShape = { inputs: InputItem[]; responseId?: string };
  function isInputItem(v: unknown): v is InputItem {
    return isRecord(v) && typeof (v as { name?: unknown }).name === "string" && "value" in v;
  }
  function isBodyShape(v: unknown): v is BodyShape {
    return (
      isRecord(v) &&
      Array.isArray((v as { inputs?: unknown }).inputs) &&
      (v as { inputs: unknown[] }).inputs.every(isInputItem)
    );
  }
  // 1) Simple secret header auth for external callers
  const secret = process.env.WEBHOOK_SECRET;
  const provided = req.headers.get("x-webhook-secret") ?? req.headers.get("X-Webhook-Secret");
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!isBodyShape(body) || body.inputs.length === 0) {
    return new Response(JSON.stringify({ error: "inputs must be a non-empty array" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { inputs, responseId } = body;

  // 3) Validate model exists (optional ownership)
  const modelId = ctx.params.id;
  const m = await db.select().from(model).where(eq(model.id, modelId)).limit(1);
  if (!m[0]) {
    return new Response(JSON.stringify({ error: "Model not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // 4) Collect names
  const names = Array.from(new Set(inputs.map((i) => i.name)));
  if (names.length === 0) {
    return new Response(JSON.stringify({ error: "No valid attribute names provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // 5) Load matching attribute definitions for this model
  const defs = await db
    .select({ id: attributeDefinitions.id, name: attributeDefinitions.name })
    .from(attributeDefinitions)
    .where(and(eq(attributeDefinitions.modelId, modelId), inArray(attributeDefinitions.name, names)));

  const byName = new Map(defs.map((d) => [d.name, d.id]));

  // 6) Process each input independently (non-transactional per-item status)
  const results: Array<{ name: string; status: "updated" | "error"; error?: string }> = [];
  for (const item of inputs) {
    const name = item.name;
    const attrId = byName.get(name);
    if (!attrId) {
      results.push({ name, status: "error", error: "AttributeDefinition not found" });
      continue;
    }

    try {
      await setLastValue({ attributeDefinitionId: attrId, payload: item.value, source: "webhook", responseId });
      results.push({ name, status: "updated" });
    } catch (err) {
      results.push({ name, status: "error", error: (err as Error).message });
    }
  }

  const hasError = results.some((r) => r.status === "error");
  return new Response(
    JSON.stringify({ modelId, results }, null, 2),
    { status: hasError ? 207 : 200, headers: { "content-type": "application/json" } }
  );
}
