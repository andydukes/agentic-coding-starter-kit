import { headers } from "next/headers";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    const rows = await db
      .select()
      .from(model)
      .where(eq(model.userId, userId))
      .orderBy(desc(model.createdAt));

    return Response.json(rows);
  } catch (err) {
    console.error("GET /api/models error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
