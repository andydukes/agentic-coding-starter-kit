import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { Model as ModelType, AttributeItem } from "@/lib/types";

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

  const attrs: ReadonlyArray<AttributeItem> | undefined =
    m.attributes?.metadata?.attributes as ReadonlyArray<AttributeItem> | undefined;

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
          {attrs.map((a, i) => (
            <div key={`${a.name}-${i}`} className="border rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.type}</div>
              </div>
              <div className="text-sm text-muted-foreground">{a.question}</div>
              <div className="text-xs mt-2">
                <div className="font-medium mb-1">Domain</div>
                <pre className="whitespace-pre-wrap break-words bg-muted/20 rounded p-2">{JSON.stringify(a.domain, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
