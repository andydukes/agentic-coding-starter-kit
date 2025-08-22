import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseValidateDereference } from "@/lib/openapi/parser";
import { upsertOpenApiIntoDb } from "@/lib/openapi/map-to-db";

export const maxDuration = 60; // edge/runtime limit safety

async function readBody(req: Request): Promise<{ url?: string; content?: string | Buffer }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.url === "string") return { url: body.url };
    if (typeof body?.content === "string") return { content: body.content };
    throw new Response("Expected { url } or { content }", { status: 400 });
  }
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const url = form.get("url");
    if (typeof url === "string" && url) return { url };
    if (file && typeof (file as File).arrayBuffer === "function") {
      const buf = Buffer.from(await (file as File).arrayBuffer());
      return { content: buf };
    }
    throw new Response("Provide a 'url' or 'file' field", { status: 400 });
  }
  // Fallback: treat as raw text
  const text = await req.text();
  if (text.trim()) return { content: text };
  throw new Response("Unsupported content-type", { status: 415 });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const src = await readBody(req);
    // Basic safety: only allow http/https URLs
    if (src.url && !/^https?:\/\//i.test(src.url)) {
      return new Response("Only http/https URLs are allowed", { status: 400 });
    }

    const deref = await parseValidateDereference(src);
    const result = await upsertOpenApiIntoDb(deref as any);

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("/api/openapi/import error", err);
    const message = typeof err?.message === "string" ? err.message : "Import failed";
    return new Response(message, { status: 400 });
  }
}
