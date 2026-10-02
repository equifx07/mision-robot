import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ITEMS } from "@/lib/items";
import { getAnswers, getAttempt, listSchools } from "@/lib/repo";
import { attentionStatus, isRapid, loadReference, SIGNAL, SIGNAL_LABEL, studentSignals, type SignalKey } from "@/lib/patrones";
import { dimensionOf, fmt, levelOf, MAX_SCORE, scoreAttempts } from "@/lib/stats";
import { TASK_NAME } from "@/lib/insights";
import { LEVEL_TONE } from "@/lib/semaforo";
import { Chip, HEADING } from "@/components/admin/ui";
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
  const ref = loadReference();
  const [scored] = scoreAttempts([{ ...attempt, school_name: school?.name ?? "", course_name: course?.name ?? "" }], answers);
  const sig = studentSignals(scored, ref);
  const att = attentionStatus(sig.signals.length);
  const times = (x: number) => (x >= 3 ? fmt(x, 0) : fmt(x, 1).replace(",0", ""));
  const detail: Record<SignalKey, string> = {
    apuro: sig.rushed
      ? `${sig.rushed} ${sig.rushed === 1 ? "respuesta apurada" : "respuestas apuradas"}: ${sig.rushedIds.join(", ")}. Cuenta como señal desde ${SIGNAL.rushed}.`
      : "Ninguna respuesta apurada.",
    caida: !Number.isFinite(sig.drop)
      ? "Faltan respuestas para calcularlo."
      : sig.drop > 0
        ? `Comparado con el resto, al final le fue ${Math.round(sig.drop * 100)} puntos peor que al principio. Cuenta como señal desde ${Math.round(SIGNAL.drop * 100)}.`
        : "Comparado con el resto, al final le fue igual o mejor que al principio.",
    acelero: !Number.isFinite(sig.speed)
      ? "Faltan respuestas para calcularlo."
      : sig.speed < 1
        ? `Al final fue ${times(1 / sig.speed)} veces más rápido que al principio, comparado con el tiempo típico de cada misión. Cuenta como señal desde 2 veces.`
        : "Al final no se apuró: fue a su ritmo o más lento.",
  };

  const rows = ITEMS.map((item, i) => {
    const a = byItem.get(item.id);
    const dim = dimensionOf(item);
    return {
      n: i + 1,
      item,
      dim: dim.label,
      task: item.part === "A" ? TASK_NAME[item.task].split(" ")[0] : "–",
      chosen: a?.chosen ?? null,
      correct: a ? a.is_correct === 1 : null,
      timeS: a?.time_ms ? a.time_ms / 1000 : null,
      typicalS: Number.isFinite(ref.medianMs[item.id]) ? ref.medianMs[item.id] / 1000 : null,
      rushed: a?.chosen !== null && a?.chosen !== undefined && isRapid(ref, item.id, a.time_ms && a.time_ms > 0 ? a.time_ms : null),
      order: attempt.option_orders[item.id],
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/estudiantes" className="text-sm text-[#55504A] underline-offset-2 hover:underline">
            ← Estudiantes
          </Link>
          <h1 className={`${HEADING} m-0 text-[32px] font-semibold`}>{attempt.student_name}</h1>
          <p className="m-0 text-[15px] text-[#55504A]">
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
          ["Nivel", finished ? <Chip tone={LEVEL_TONE[levelOf(total).key]}>{levelOf(total).name}</Chip> : "–"],
          ["Parte A", `${answers.filter((a) => a.is_correct === 1 && a.item_id.startsWith("A")).length} / 20`],
          ["Parte B", `${answers.filter((a) => a.is_correct === 1 && a.item_id.startsWith("B")).length} / 8`],
          ["Tiempo total", attempt.total_ms ? `${fmt(attempt.total_ms / 60000, 0)} min` : "–"],
          ["Datos", `${attempt.age ? attempt.age + " años" : "edad –"} · ${attempt.prior_exp ? EXP[attempt.prior_exp] : "exp. –"} · ${attempt.gender ? GENDER[attempt.gender] : "género –"}`],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-2xl border border-[#E5E1D8] bg-white p-3">
            <div className="text-xs font-semibold text-[#6B665E]">{k}</div>
            <div className="mt-1 text-base font-semibold text-[#22211F]">{v}</div>
          </div>
        ))}
      </div>
      <p className="m-0 text-xs text-[#6B665E]">
        Dispositivo: {attempt.device ?? "–"} · pantalla {attempt.screen ?? "–"} · versión de la prueba {attempt.test_version}
      </p>

      {finished && (
        <section aria-labelledby="atencion" className="flex flex-col gap-3 rounded-[20px] border border-[#E5E1D8] bg-white p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="atencion" className={`${HEADING} m-0 text-xl font-semibold`}>
              Señales de atención
            </h2>
            <Chip tone={att.tone}>{att.label}</Chip>
            <span className="text-[13px] text-[#6B665E]">Una sola señal puede ser casualidad; varias juntas sugieren que el puntaje es menor que lo que sabe.</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(["apuro", "caida", "acelero"] as const).map((k) => {
              const on = sig.signals.includes(k);
              return (
                <div key={k} className={`flex flex-col gap-1 rounded-2xl px-4 py-3 ${on ? "bg-[#FADBD6]" : "bg-[#F6F4EF]"}`}>
                  <span className={`text-sm font-bold ${on ? "text-[#9B2019]" : "text-[#22211F]"}`}>
                    {on ? "⚠ " : "✓ "}
                    {SIGNAL_LABEL[k]}
                  </span>
                  <span className="text-[13px] leading-snug text-[#3D3A35]">{detail[k]}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <AnswerReview rows={rows} />
    </div>
  );
}
