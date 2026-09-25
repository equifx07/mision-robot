import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ITEMS } from "@/lib/items";
import { getAnswers, getAttempt, listSchools } from "@/lib/repo";
import { dimensionOf, fmt, levelOf, MAX_SCORE, TASK_LABEL } from "@/lib/stats";
import { deleteAttemptAction } from "../../actions";
import { ConfirmButton } from "../../ConfirmButton";
import { AnswerReview } from "./AnswerReview";

export const dynamic = "force-dynamic";

const EXP: Record<string, string> = { nunca: "Nunca", algunas: "Algunas veces", siempre: "Todos los años" };
const GENDER: Record<string, string> = { femenino: "Femenino", masculino: "Masculino", otro: "Otro", no_dice: "Prefiere no decir" };
const STATUS: Record<string, string> = { finished: "Terminada", timed_out: "Terminada por tiempo", in_progress: "En curso" };

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const attempt = getAttempt(id);
  if (!attempt) notFound();
  const answers = getAnswers(id);
  const byItem = new Map(answers.map((a) => [a.item_id, a]));
  const school = listSchools().find((s) => s.id === attempt.school_id);
  const course = school?.courses.find((c) => c.id === attempt.course_id);
  const total = answers.filter((a) => a.is_correct === 1).length;
  const finished = attempt.status !== "in_progress";

  const rows = ITEMS.map((item, i) => {
    const a = byItem.get(item.id);
    const dim = dimensionOf(item);
    return {
      n: i + 1,
      item,
      dim: dim.label,
      task: item.part === "A" ? TASK_LABEL[item.task] : "–",
      chosen: a?.chosen ?? null,
      correct: a ? a.is_correct === 1 : null,
      timeS: a?.time_ms ? a.time_ms / 1000 : null,
      order: attempt.option_orders[item.id],
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/estudiantes" className="text-sm text-slate-500 hover:underline">
            ← Estudiantes
          </Link>
          <h1 className="text-2xl font-black text-slate-900">{attempt.student_name}</h1>
          <p className="text-sm text-slate-600">
            {school?.name ?? "–"} · {course?.name ?? "–"} · {new Date(attempt.started_at).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <form action={deleteAttemptAction}>
          <input type="hidden" name="id" value={attempt.id} />
          <ConfirmButton message="¿Borrar esta prueba? No se puede deshacer." className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            Borrar prueba
          </ConfirmButton>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {[
          ["Estado", STATUS[attempt.status] ?? attempt.status],
          ["Puntaje", finished ? `${total} / ${MAX_SCORE}` : `${total} hasta ahora`],
          ["Nivel", finished ? levelOf(total).name : "–"],
          ["Parte A", `${answers.filter((a) => a.is_correct === 1 && a.item_id.startsWith("A")).length} / 20`],
          ["Parte B", `${answers.filter((a) => a.is_correct === 1 && a.item_id.startsWith("B")).length} / 8`],
          ["Tiempo total", attempt.total_ms ? `${fmt(attempt.total_ms / 60000, 0)} min` : "–"],
          ["Datos", `${attempt.age ? attempt.age + " años" : "edad –"} · ${attempt.prior_exp ? EXP[attempt.prior_exp] : "exp. –"} · ${attempt.gender ? GENDER[attempt.gender] : "género –"}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-black/10">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-0.5 text-base font-semibold text-slate-900">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Dispositivo: {attempt.device ?? "–"} · pantalla {attempt.screen ?? "–"} · versión de la prueba {attempt.test_version}
      </p>

      <AnswerReview rows={rows} />
    </div>
  );
}
