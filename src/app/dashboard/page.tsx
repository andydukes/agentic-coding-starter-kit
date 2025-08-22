import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { ModelsList } from "@/components/dashboard/models-list";
import type { Model as ModelType } from "@/lib/types";

export default async function DashboardPage() {
  // Layout already enforces auth; session should exist
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const userId = session.user.id;

  const models = (await db
    .select()
    .from(model)
    .where(eq(model.userId, userId))
    .orderBy(desc(model.createdAt))) as ModelType[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Models</h1>
        <p className="text-muted-foreground">Manage and view your UP2TOM models.</p>
      </div>
      <ModelsList models={models} />
    </div>
  );
}
