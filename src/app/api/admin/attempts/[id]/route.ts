import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteAttempt, getAttempt } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Borra una prueba (mismo efecto que el botón "Borrar prueba" del panel).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  if (!getAttempt(id)) return NextResponse.json({ error: "No existe" }, { status: 404 });
  deleteAttempt(id);
  return NextResponse.json({ ok: true });
}
