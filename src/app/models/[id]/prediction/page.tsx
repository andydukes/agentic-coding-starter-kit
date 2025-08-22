import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { Model as ModelType, Prediction as PredictionType } from "@/lib/types";

export default async function PredictionPage({
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

  const prediction: PredictionType | undefined = m.attributes?.metadata?.prediction;
  if (!prediction) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Prediction</h1>
        <p className="text-sm text-muted-foreground mt-2">No prediction metadata found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">Prediction</h1>
        <p className="text-sm text-muted-foreground">{m.attributes.name}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="border rounded-md p-3">
          <div className="font-medium mb-1">Name</div>
          <div className="text-muted-foreground">{prediction.name}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="font-medium mb-1">Type</div>
          <div className="text-muted-foreground">{prediction.type}</div>
        </div>
        <div className="md:col-span-2 border rounded-md p-3">
          <div className="font-medium mb-1">Question</div>
          <div className="text-muted-foreground">{prediction.question}</div>
        </div>
        <div className="md:col-span-2 border rounded-md p-3">
          <div className="font-medium mb-1">Domain</div>
          <div className="text-muted-foreground">
            <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(prediction.domain, null, 2)}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
