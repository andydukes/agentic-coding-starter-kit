import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { endpointDefinitions, endpointOperations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EndpointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const p = await params;

  // Fetch the endpoint definition
  const def = await db
    .select()
    .from(endpointDefinitions)
    .where(eq(endpointDefinitions.id, p.id))
    .limit(1);

  const endpoint = def[0];
  if (!endpoint) return notFound();

  // Fetch operations (basic stub list)
  const ops = await db
    .select({
      id: endpointOperations.id,
      operationName: endpointOperations.operationName,
      httpMethod: endpointOperations.httpMethod,
      pathTemplate: endpointOperations.pathTemplate,
      updatedAt: endpointOperations.updatedAt,
    })
    .from(endpointOperations)
    .where(eq(endpointOperations.endpointDefinitionId, p.id))
    .orderBy(desc(endpointOperations.updatedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{endpoint.name}</h1>
        <p className="text-muted-foreground">
          Provider: <span className="font-medium">{endpoint.provider}</span>
        </p>
        <div className="mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Base URL:</span> {endpoint.baseUrlTemplate || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Auth Ref:</span> {endpoint.authRef || "—"}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Operations</h2>
        <div className="mt-2 border rounded-md divide-y bg-card">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 text-sm text-muted-foreground">
            <div>Name</div>
            <div>Method</div>
            <div>Path</div>
            <div>Updated</div>
          </div>
          {ops.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">No operations defined.</div>
          ) : (
            ops.map((op) => (
              <div key={op.id} className="grid grid-cols-4 gap-2 px-4 py-3">
                <div className="font-medium">{op.operationName}</div>
                <div>
                  <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">
                    {op.httpMethod}
                  </span>
                </div>
                <div className="truncate" title={op.pathTemplate ?? undefined}>
                  {op.pathTemplate}
                </div>
                <div className="text-sm text-muted-foreground">
                  {op.updatedAt?.toISOString?.() ?? "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
