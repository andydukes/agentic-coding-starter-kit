import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { model } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await ctx.params;

  try {
    const rows = await db
      .select()
      .from(model)
      .where(and(eq(model.id, id), eq(model.userId, userId)))
      .limit(1);

    if (!rows[0]) {
      return new Response("Not Found", { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (err) {
    console.error(`GET /api/models/${id} error`, err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
