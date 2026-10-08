import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { countDemo, deleteDemo, generateDemo } from "@/lib/demo";
import { isGrade } from "@/lib/tests";

export const dynamic = "force-dynamic";

// Datos de demostración (marcados con dispositivo "demo").
// POST { schoolId, grade: "4" | "6", count?, abilityShift? } genera pruebas; DELETE borra todas las de demo; GET cuenta.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: { schoolId?: number; grade?: string; count?: number; abilityShift?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const schoolId = Number(body.schoolId);
  const count = Math.min(200, Math.max(1, Number(body.count) || 30));
  if (!Number.isInteger(schoolId)) return NextResponse.json({ error: "Falta schoolId" }, { status: 400 });
  if (!isGrade(body.grade)) return NextResponse.json({ error: "Falta grade (\"4\" o \"6\")" }, { status: 400 });
  try {
    const result = generateDemo({ schoolId, grade: body.grade, count, abilityShift: Number(body.abilityShift) || 0 });
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
