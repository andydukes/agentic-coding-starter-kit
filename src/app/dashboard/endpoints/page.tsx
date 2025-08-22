import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { endpointDefinitions } from "@/lib/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { ProviderFilter } from "@/components/endpoints/provider-filter";
import { SearchInput } from "@/components/endpoints/search-input";
import { Pagination } from "@/components/endpoints/pagination";
import { PageSizeSelect } from "@/components/endpoints/page-size-select";
import { ImportOpenApi } from "@/components/endpoints/import-openapi";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EndpointsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Enforce auth via same pattern as dashboard
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const sp = await searchParams;
  const provider = typeof sp.provider === "string" ? sp.provider : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number.isFinite(Number(sp.page)) && Number(sp.page) ? Math.max(1, Number(sp.page)) : 1;
  const pageSizeRaw = Number.isFinite(Number(sp.pageSize)) && Number(sp.pageSize) ? Number(sp.pageSize) : 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  const offset = (page - 1) * pageSize;

  // Distinct provider list
  const providersRows = await db
    .select({ provider: endpointDefinitions.provider })
    .from(endpointDefinitions)
    .groupBy(endpointDefinitions.provider)
    .orderBy(endpointDefinitions.provider);
  const providers = providersRows.map((r) => r.provider).filter(Boolean);

  // Build a single where expression
  const providerCond = provider ? eq(endpointDefinitions.provider, provider) : undefined;
  const nameCond = q ? ilike(endpointDefinitions.name, `%${q}%`) : undefined;
  const whereExpr = providerCond && nameCond ? and(providerCond, nameCond) : providerCond ?? nameCond;

  // Total count (for pagination)
  const totalRow = await (
    whereExpr
      ? db.select({ total: count() }).from(endpointDefinitions).where(whereExpr)
      : db.select({ total: count() }).from(endpointDefinitions)
  );
  const total = totalRow[0]?.total ?? 0;

  // Fetch endpoint definitions with optional filter
  const baseListQuery = db
    .select({
      id: endpointDefinitions.id,
      name: endpointDefinitions.name,
      provider: endpointDefinitions.provider,
      baseUrlTemplate: endpointDefinitions.baseUrlTemplate,
      updatedAt: endpointDefinitions.updatedAt,
    })
    .from(endpointDefinitions);
  const endpoints = await (whereExpr ? baseListQuery.where(whereExpr) : baseListQuery)
    .orderBy(desc(endpointDefinitions.updatedAt))
    .limit(pageSize)
    .offset(offset);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">Endpoints</h1>
          <p className="text-muted-foreground">Browse configured API endpoints and operations.</p>
          <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">{total} total</span>
          <SearchInput />
        </div>
        <div className="flex items-center gap-3">
          <PageSizeSelect current={pageSize} />
          <ProviderFilter providers={providers} current={provider ?? null} />
          <ImportOpenApi />
        </div>
      </div>

      <div className="border rounded-md divide-y bg-card">
        <div className="grid grid-cols-4 gap-2 px-4 py-2 text-sm text-muted-foreground">
          <div>Name</div>
          <div>Provider</div>
          <div>Base URL</div>
          <div>Updated</div>
        </div>
        {endpoints.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No endpoints found.</div>
        ) : (
          endpoints.map((e) => (
            <div key={e.id} className="grid grid-cols-4 gap-2 px-4 py-3">
              <div className="font-medium">
                <Link href={`/dashboard/endpoints/${e.id}`} className="hover:underline">
                  {e.name}
                </Link>
              </div>
              <div>
                <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">
                  {e.provider}
                </span>
              </div>
              <div className="truncate" title={e.baseUrlTemplate ?? undefined}>
                {e.baseUrlTemplate || "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                {e.updatedAt?.toISOString?.() ?? "—"}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
