import { NextResponse } from "next/server";
import { finishAttempt, getAttempt } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Cierra la prueba. No hay límite de tiempo: se guarda cuánto tardó en total.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const attempt = getAttempt(id);
  if (!attempt) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const done = finishAttempt(id);
  return NextResponse.json({ ok: true, status: done.status });
}
