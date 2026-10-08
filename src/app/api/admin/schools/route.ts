import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createSchool, listSchools } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Alta de colegios por API (misma sesión de administrador que el panel).
// Body: { "name": "Escuela X" }  o  { "schools": [ { "name": "Escuela X" }, ... ] }
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: { name?: string; schools?: { name: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const input = body.schools ?? (body.name ? [{ name: body.name }] : []);
  if (input.length === 0) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  const created: { school: string; id: number }[] = [];
  for (const s of input) {
    const name = String(s.name ?? "").trim();
    if (name.length < 2) continue;
    const existing = listSchools().find((x) => x.name === name);
    created.push({ school: name, id: existing ? existing.id : createSchool(name) });
  }
  return NextResponse.json({ ok: true, created, schools: listSchools() });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ schools: listSchools() });
}
