import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseValidateDereference } from "@/lib/openapi/parser";
import { upsertOpenApiIntoDb } from "@/lib/openapi/map-to-db";

export const maxDuration = 60; // hard cap by platform; we also apply our own timeout

const MAX_BYTES = Number(process.env.OPENAPI_IMPORT_MAX_BYTES || 5_000_000); // 5 MB default
const MAX_SECONDS = Number(process.env.OPENAPI_IMPORT_MAX_SECONDS || 30); // 30s default

async function fetchWithLimits(url: string, maxBytes: number, timeoutMs: number): Promise<Buffer> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
    const cl = res.headers.get("content-length");
    if (cl && Number(cl) > maxBytes) throw new Error("Remote file too large");
    if (!res.body) return Buffer.from(await res.arrayBuffer());
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > maxBytes) {
          reader.cancel();
          throw new Error("Remote file exceeded size limit");
        }
        chunks.push(value);
      }
    }
    const merged = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    return Buffer.from(merged.buffer);
  } finally {
    clearTimeout(to);
  }
}

async function readBody(req: Request): Promise<{ content: string | Buffer }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.url === "string") {
      if (!/^https?:\/\//i.test(body.url)) {
        throw new Response("Only http/https URLs are allowed", { status: 400 });
      }
      const buf = await fetchWithLimits(body.url, MAX_BYTES, MAX_SECONDS * 1000);
      return { content: buf };
    }
    if (typeof body?.content === "string") {
      const bytes = Buffer.byteLength(body.content, "utf8");
      if (bytes > MAX_BYTES) throw new Response("Payload too large", { status: 413 });
      return { content: body.content };
    }
    throw new Response("Expected { url } or { content }", { status: 400 });
  }
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file && typeof (file as File).arrayBuffer === "function") {
      const f = file as File;
      if (typeof f.size === "number" && f.size > MAX_BYTES) {
        throw new Response("File too large", { status: 413 });
      }
      const buf = Buffer.from(await (file as File).arrayBuffer());
      return { content: buf };
    }
    throw new Response("Provide a 'url' or 'file' field", { status: 400 });
  }
  // Fallback: treat as raw text
  const text = await req.text();
  if (text.trim()) {
    const bytes = Buffer.byteLength(text, "utf8");
    if (bytes > MAX_BYTES) throw new Response("Payload too large", { status: 413 });
    return { content: text };
  }
  throw new Response("Unsupported content-type", { status: 415 });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message = "Import timed out"): Promise<T> {
  let to: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      to = setTimeout(() => reject(new Error(message)), ms);
    });
    const result = await Promise.race([promise, timeout]);
    return result as T;
  } finally {
    if (to) clearTimeout(to);
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const src = await readBody(req);
    const deref = await withTimeout(parseValidateDereference(src), MAX_SECONDS * 1000);
    const result = await upsertOpenApiIntoDb(deref as any);

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("/api/openapi/import error", err);
    const message = typeof err?.message === "string" ? err.message : "Import failed";
    return new Response(message, { status: 400 });
  }
}
