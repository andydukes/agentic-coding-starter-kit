// Constants for statuses
const STATUS_UPDATED = "updated";
const STATUS_ERROR = "error";

// ... (imports)
import { db } from "@/lib/db";
import { attributeDefinitions, model } from "@/lib/schema";
import { inArray, and, eq } from "drizzle-orm";
import { setLastValue } from "@/lib/last-value";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  // ... (type guards)
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
    console.error("Unauthorized webhook access attempt."); // Example logging
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid webhook secret." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Failed to parse JSON body:", error); // Example logging
    return new Response(JSON.stringify({ error: "Invalid JSON body. Please provide valid JSON." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!isBodyShape(body) || body.inputs.length === 0) {
    console.error("Invalid body shape or empty inputs array."); // Example logging
    return new Response(JSON.stringify({ error: "Invalid request body. 'inputs' must be a non-empty array of objects with 'name' and 'value'." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { inputs, responseId } = body;

  // 3) Validate model exists (optional ownership)
  const modelId = ctx.params.id;
  let m;
  try {
    m = await db.select().from(model).where(eq(model.id, modelId)).limit(1);
  } catch (dbError) {
    console.error(`Database error validating model ${modelId}:`, dbError); // Example logging
    return new Response(JSON.stringify({ error: "Internal server error while validating model." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!m[0]) {
    console.warn(`Model not found for webhook: ${modelId}`); // Example logging
    return new Response(JSON.stringify({ error: `Model with ID '${modelId}' not found.` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // 4) Collect names
  const names = Array.from(new Set(inputs.map((i) => i.name)));
  if (names.length === 0) {
    return new Response(JSON.stringify({ error: "No valid attribute names provided in inputs." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // 5) Load matching attribute definitions for this model
  let defs;
  try {
    defs = await db
      .select({ id: attributeDefinitions.id, name: attributeDefinitions.name })
      .from(attributeDefinitions)
      .where(and(eq(attributeDefinitions.modelId, modelId), inArray(attributeDefinitions.name, names)));
  } catch (dbError) {
    console.error(`Database error loading attribute definitions for model ${modelId}:`, dbError); // Example logging
    return new Response(JSON.stringify({ error: "Internal server error while fetching attribute definitions." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const byName = new Map(defs.map((d) => [d.name, d.id]));

  // 6) Process each input independently (non-transactional per-item status)
  const results: Array<{ name: string; status: typeof STATUS_UPDATED | typeof STATUS_ERROR; error?: string }> = [];

  // Consider using Promise.all for parallel processing if setLastValue is I/O bound and order doesn't matter
  // For now, keeping sequential for simpler error handling and debugging
  for (const item of inputs) {
    const name = item.name;
    const attrId = byName.get(name);

    if (!attrId) {
      results.push({ name, status: STATUS_ERROR, error: "AttributeDefinition not found for this model." });
      continue;
    }

    try {
      // Add more specific value validation here if needed based on attributeDefinitions
      await setLastValue({ attributeDefinitionId: attrId, payload: item.value, source: "webhook", responseId });
      results.push({ name, status: STATUS_UPDATED });
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : String(err);
      console.error(`Error setting last value for attribute ${name} (ID: ${attrId}) on model ${modelId}:`, err); // Example logging
      results.push({ name, status: STATUS_ERROR, error: `Failed to update: ${errorMessage}` });
    }
  }

  const hasError = results.some((r) => r.status === STATUS_ERROR);
  return new Response(
    JSON.stringify({ modelId, results }, null, 2),
    { status: hasError ? 207 : 200, headers: { "content-type": "application/json" } }
  );
}