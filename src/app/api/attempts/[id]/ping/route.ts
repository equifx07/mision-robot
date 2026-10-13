import { NextResponse } from "next/server";
import { touchAttempt } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Señal de vida de la prueba abierta (panel En vivo). Body: { where: "Misión 7" }.
// Responde el estado: si no es "in_progress", la pantalla del chico muestra que la prueba se cerró.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let where: string | null = null;
  try {
    const body = (await req.json()) as { where?: unknown };
    where = body.where ? String(body.where).slice(0, 60) : null;
  } catch {
    /* sin cuerpo */
  }
  const status = touchAttempt(id, where);
  if (!status) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ status });
}
