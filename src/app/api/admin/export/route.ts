import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ITEMS } from "@/lib/items";
import { listAllAnswers, listAttempts } from "@/lib/repo";
import { isRapid, loadReference, SIGNAL_LABEL, studentSignals } from "@/lib/patrones";
import { DIMENSIONS, dimensionOf, levelOf, scoreAttempts, TASK_LABEL } from "@/lib/stats";

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

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const tipo = new URL(req.url).searchParams.get("tipo") ?? "estudiantes";
  const attempts = listAttempts();
  const answers = listAllAnswers(attempts.map((a) => a.id));
  const scored = scoreAttempts(attempts, answers);
  const ref = loadReference();

  if (tipo === "items") {
    const rows: unknown[][] = [["item", "parte", "dimension", "tarea", "consigna", "opcion_correcta_canonica"]];
    for (const it of ITEMS) rows.push([it.id, it.part, dimensionOf(it).label, it.part === "A" ? TASK_LABEL[it.task] : "", it.prompt, "abcd"[it.correct]]);
    return respond("items.csv", csv(rows));
  }

  if (tipo === "respuestas") {
    const rows: unknown[][] = [["prueba_id", "estudiante", "colegio", "curso", "estado", "item", "posicion", "parte", "dimension", "tarea", "opcion_elegida_canonica", "correcta", "tiempo_s", "tiempo_tipico_s", "apurada"]];
    for (const r of scored) {
      for (const it of ITEMS) {
        const chosen = r.chosen[it.id];
        rows.push([
          r.attempt.id,
          r.attempt.student_name,
          r.attempt.school_name,
          r.attempt.course_name,
          r.attempt.status,
          it.id,
          ITEMS.indexOf(it) + 1,
          it.part,
          dimensionOf(it).label,
          it.part === "A" ? TASK_LABEL[it.task] : "",
          chosen === null ? "" : "abcd"[chosen],
          chosen === null ? "" : r.correct[it.id],
          r.times[it.id] === null ? "" : Math.round((r.times[it.id] ?? 0) / 100) / 10,
          Number.isFinite(ref.medianMs[it.id]) ? Math.round(ref.medianMs[it.id] / 100) / 10 : "",
          chosen === null ? "" : isRapid(ref, it.id, r.times[it.id] && r.times[it.id]! > 0 ? r.times[it.id] : null) ? 1 : 0,
        ]);
      }
    }
    return respond("respuestas.csv", csv(rows));
  }

  const head = [
    "prueba_id", "estudiante", "colegio", "curso", "fecha_inicio", "estado", "edad", "experiencia_previa", "genero", "dispositivo", "pantalla",
    "puntaje_total", "puntaje_parte_a", "puntaje_parte_b", "nivel", "tiempo_total_min", "tiempo_misiones_min",
    "respuestas_apuradas", "caida_final", "ritmo_final_vs_inicio", "senales_atencion",
    ...DIMENSIONS.map((d) => `acierto_${d.label.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}`),
    "acierto_secuenciar", "acierto_completar", "acierto_depurar", "acierto_evaluar",
  ];
  const rows: unknown[][] = [head];
  for (const r of scored) {
    const a = r.attempt;
    const finished = a.status !== "in_progress";
    const sig = studentSignals(r, ref);
    const missionsMs = ITEMS.reduce((acc, it) => acc + (r.times[it.id] ?? 0), 0);
    const round2 = (x: number) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : "");
    rows.push([
      a.id, a.student_name, a.school_name, a.course_name, a.started_at, a.status, a.age, a.prior_exp, a.gender, a.device, a.screen,
      finished ? r.total : "", finished ? (a.score_a ?? "") : "", finished ? (a.score_b ?? "") : "", finished ? levelOf(r.total).name : "",
      a.total_ms ? Math.round(a.total_ms / 6000) / 10 : "",
      missionsMs ? Math.round(missionsMs / 6000) / 10 : "",
      sig.rushed, round2(sig.drop), round2(sig.speed), sig.signals.map((k) => SIGNAL_LABEL[k]).join(" + "),
      ...DIMENSIONS.map((d) => (r.byDimension[d.key] ? Math.round((r.byDimension[d.key].correct / r.byDimension[d.key].total) * 100) / 100 : "")),
      ...["S", "C", "D", "E"].map((t) => (r.byTask[t] ? Math.round((r.byTask[t].correct / r.byTask[t].total) * 100) / 100 : "")),
    ]);
  }
  return respond("estudiantes.csv", csv(rows));
}
