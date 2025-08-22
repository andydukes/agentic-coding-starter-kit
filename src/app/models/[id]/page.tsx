import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { ModelDetail } from "@/components/dashboard/model-detail";

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    notFound();
  }

  const { id } = await params;
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(model)
    .where(and(eq(model.id, id), eq(model.userId, userId)))
    .limit(1);

  const m = rows[0];
  if (!m) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      {/* @ts-expect-error Server Component passing to Client Component */}
      <ModelDetail model={m} />
    </div>
  );
}
