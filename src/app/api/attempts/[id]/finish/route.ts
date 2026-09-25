import { NextResponse } from "next/server";
import { finishAttempt, getAttempt, TIME_LIMIT_MS } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const attempt = getAttempt(id);
  if (!attempt) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const timedOut = Date.now() - Date.parse(attempt.started_at) > TIME_LIMIT_MS;
  const done = finishAttempt(id, timedOut ? "timed_out" : "finished");
  return NextResponse.json({ ok: true, status: done.status });
}
