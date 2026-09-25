import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { countDemo, deleteDemo, generateDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Datos de demostración (marcados con dispositivo "demo").
// POST { schoolId, perCourse?, abilityShift? } genera pruebas; DELETE borra todas las de demo; GET cuenta.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: { schoolId?: number; perCourse?: number; abilityShift?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const schoolId = Number(body.schoolId);
  const perCourse = Math.min(200, Math.max(1, Number(body.perCourse) || 15));
  if (!Number.isInteger(schoolId)) return NextResponse.json({ error: "Falta schoolId" }, { status: 400 });
  try {
    const result = generateDemo({ schoolId, perCourse, abilityShift: Number(body.abilityShift) || 0 });
    return NextResponse.json({ ok: true, ...result, totalDemo: countDemo() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true, deleted: deleteDemo() });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ demo: countDemo() });
}
