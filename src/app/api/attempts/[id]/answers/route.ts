import { NextResponse } from "next/server";
import { getAttempt, saveAnswer } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const attempt = getAttempt(id);
  if (!attempt) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (attempt.status !== "in_progress") return NextResponse.json({ error: "La prueba ya terminó", status: attempt.status }, { status: 409 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const itemId = String(body.itemId ?? "");
  const chosen = body.chosen === null || body.chosen === undefined ? null : Number(body.chosen);
  if (chosen !== null && (!Number.isInteger(chosen) || chosen < 0 || chosen > 3)) return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
  const timeMs = Number.isFinite(Number(body.timeMs)) ? Math.max(0, Math.round(Number(body.timeMs))) : null;
  try {
    saveAnswer(id, itemId, chosen, timeMs, body.shownAt ? String(body.shownAt) : null, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
