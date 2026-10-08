import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listAllAnswers, listAttempts } from "@/lib/repo";
import { isRapid, loadReference, SIGNAL_LABEL, studentSignals } from "@/lib/patrones";
import { dimensionOf, dimensionsOf, levelOf, scoreAttempts, TASK_LABEL } from "@/lib/stats";
import { isGrade, testOf } from "@/lib/tests";

export const dynamic = "force-dynamic";

const SEP = ";";
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  if (/[;"\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csv(rows: unknown[][]): string {
  return "﻿" + rows.map((r) => r.map(cell).join(SEP)).join("\r\n");
}
function respond(name: string, body: string) {
  return new NextResponse(body, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` },
  });
}

// Exportación de UNA prueba: ?grado=4 o ?grado=6 (las dos pruebas tienen misiones distintas).
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const tipo = params.get("tipo") ?? "estudiantes";
  const grado = params.get("grado");
  if (!isGrade(grado)) return NextResponse.json({ error: "Falta el grado (?grado=4 o ?grado=6)" }, { status: 400 });
  const test = testOf(grado);
  const attempts = listAttempts({ grade: test.grade });
  const answers = listAllAnswers(attempts.map((a) => a.id));
  const scored = scoreAttempts(test, attempts, answers);
  const ref = loadReference(test);
  const suffix = `${test.grade}grado`;

  if (tipo === "items") {
    const rows: unknown[][] = [["item", "posicion", "parte", "dimension", "tarea", "consigna", "opcion_correcta_canonica"]];
    test.items.forEach((it, i) => rows.push([it.id, i + 1, it.part, dimensionOf(it).label, it.part === "A" ? TASK_LABEL[it.task] : "", it.prompt, "abcd"[it.correct]]));
    return respond(`items-${suffix}.csv`, csv(rows));
  }

  if (tipo === "respuestas") {
    const rows: unknown[][] = [["prueba_id", "estudiante", "colegio", "grado", "estado", "item", "posicion", "parte", "dimension", "tarea", "opcion_elegida_canonica", "correcta", "tiempo_s", "tiempo_tipico_s", "apurada"]];
    for (const r of scored) {
      test.items.forEach((it, i) => {
        const chosen = r.chosen[it.id];
        rows.push([
          r.attempt.id,
          r.attempt.student_name,
          r.attempt.school_name,
          test.grade,
          r.attempt.status,
          it.id,
          i + 1,
          it.part,
          dimensionOf(it).label,
          it.part === "A" ? TASK_LABEL[it.task] : "",
          chosen === null ? "" : "abcd"[chosen],
          chosen === null ? "" : r.correct[it.id],
          r.times[it.id] === null ? "" : Math.round((r.times[it.id] ?? 0) / 100) / 10,
          Number.isFinite(ref.medianMs[it.id]) ? Math.round(ref.medianMs[it.id] / 100) / 10 : "",
          chosen === null ? "" : isRapid(ref, it.id, r.times[it.id] && r.times[it.id]! > 0 ? r.times[it.id] : null) ? 1 : 0,
        ]);
      });
    }
    return respond(`respuestas-${suffix}.csv`, csv(rows));
  }

  const dims = dimensionsOf(test);
  const tasks = (["S", "C", "D", "E"] as const).filter((t) => test.items.some((it) => it.part === "A" && it.task === t));
  const TASK_COL: Record<string, string> = { S: "acierto_elegir", C: "acierto_completar", D: "acierto_arreglar", E: "acierto_comparar" };
  const head = [
    "prueba_id", "estudiante", "colegio", "grado", "version", "fecha_inicio", "estado", "edad", "experiencia_previa", "genero", "dispositivo", "pantalla",
    "puntaje_total", "puntaje_maximo", "puntaje_parte_a", "puntaje_parte_b", "nivel", "tiempo_total_min", "tiempo_misiones_min",
    "respuestas_apuradas", "caida_final", "ritmo_final_vs_inicio", "senales_atencion",
    ...dims.map((d) => `acierto_${d.label.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}`),
    ...tasks.map((t) => TASK_COL[t]),
  ];
  const rows: unknown[][] = [head];
  for (const r of scored) {
    const a = r.attempt;
    const finished = a.status !== "in_progress";
    const sig = studentSignals(r, ref);
    const missionsMs = test.items.reduce((acc, it) => acc + (r.times[it.id] ?? 0), 0);
    const round2 = (x: number) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : "");
    rows.push([
      a.id, a.student_name, a.school_name, test.grade, a.test_version, a.started_at, a.status, a.age, a.prior_exp, a.gender, a.device, a.screen,
      finished ? r.total : "", test.max, finished ? (a.score_a ?? "") : "", finished ? (a.score_b ?? "") : "", finished ? levelOf(test, r.total).name : "",
      a.total_ms ? Math.round(a.total_ms / 6000) / 10 : "",
      missionsMs ? Math.round(missionsMs / 6000) / 10 : "",
      sig.rushed, round2(sig.drop), round2(sig.speed), sig.signals.map((k) => SIGNAL_LABEL[k]).join(" + "),
      ...dims.map((d) => (r.byDimension[d.key] ? Math.round((r.byDimension[d.key].correct / r.byDimension[d.key].total) * 100) / 100 : "")),
      ...tasks.map((t) => (r.byTask[t] ? Math.round((r.byTask[t].correct / r.byTask[t].total) * 100) / 100 : "")),
    ]);
  }
  return respond(`estudiantes-${suffix}.csv`, csv(rows));
}
