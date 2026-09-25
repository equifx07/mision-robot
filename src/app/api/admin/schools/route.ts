import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createCourse, createSchool, listSchools } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Alta de colegios por API (misma sesión de administrador que el panel).
// Body: { "name": "Escuela X", "courses": ["6.º A", "6.º B"] }  o  { "schools": [ {name, courses}, ... ] }
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: { name?: string; courses?: string[]; schools?: { name: string; courses?: string[] }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const input = body.schools ?? (body.name ? [{ name: body.name, courses: body.courses }] : []);
  if (input.length === 0) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  const created: { school: string; id: number; courses: string[] }[] = [];
  for (const s of input) {
    const name = String(s.name ?? "").trim();
    if (name.length < 2) continue;
    let id: number;
    const existing = listSchools().find((x) => x.name === name);
    if (existing) id = existing.id;
    else id = createSchool(name);
    const courses: string[] = [];
    for (const c of s.courses ?? []) {
      const cname = String(c).trim();
      if (!cname) continue;
      try {
        createCourse(id, cname);
        courses.push(cname);
      } catch {
        /* ya existía */
      }
    }
    created.push({ school: name, id, courses });
  }
  return NextResponse.json({ ok: true, created, schools: listSchools() });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ schools: listSchools() });
}
