import { NextResponse } from "next/server";
import { getAnswers, getAttempt } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Estado del intento para reanudar la prueba. No devuelve si las respuestas son correctas.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const attempt = getAttempt(id);
  if (!attempt) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const answers = getAnswers(id).map((a) => ({ itemId: a.item_id, chosen: a.chosen }));
  return NextResponse.json({
    attemptId: attempt.id,
    studentName: attempt.student_name,
    startedAt: attempt.started_at,
    status: attempt.status,
    optionOrders: attempt.option_orders,
    answers,
  });
}
