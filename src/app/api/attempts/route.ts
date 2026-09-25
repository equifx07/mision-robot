import { NextResponse } from "next/server";
import { createAttempt } from "@/lib/repo";

export const dynamic = "force-dynamic";

const PRIOR = new Set(["nunca", "algunas", "siempre"]);
const GENDER = new Set(["femenino", "masculino", "otro", "no_dice"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const name = String(body.studentName ?? "").trim();
  const schoolId = Number(body.schoolId);
  const courseId = Number(body.courseId);
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Escribí tu nombre" }, { status: 400 });
  if (!Number.isInteger(schoolId) || !Number.isInteger(courseId)) return NextResponse.json({ error: "Elegí colegio y curso" }, { status: 400 });
  const age = body.age === null || body.age === undefined || body.age === "" ? null : Number(body.age);
  if (age !== null && (!Number.isInteger(age) || age < 8 || age > 16)) return NextResponse.json({ error: "Edad inválida" }, { status: 400 });
  const priorExp = body.priorExp ? String(body.priorExp) : null;
  if (priorExp && !PRIOR.has(priorExp)) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  const gender = body.gender ? String(body.gender) : null;
  if (gender && !GENDER.has(gender)) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  try {
    const attempt = createAttempt({
      schoolId,
      courseId,
      studentName: name,
      age,
      priorExp,
      gender,
      device: body.device ? String(body.device).slice(0, 40) : null,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      screen: body.screen ? String(body.screen).slice(0, 40) : null,
    });
    return NextResponse.json({ attemptId: attempt.id, startedAt: attempt.started_at, optionOrders: attempt.option_orders });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
