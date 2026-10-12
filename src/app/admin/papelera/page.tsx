import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listTrash } from "@/lib/repo";
import { testOf } from "@/lib/tests";
import { C, EmptyState, PageHeader } from "@/components/admin/ui";
import { restoreAttemptAction, restoreSchoolAction } from "../actions";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export default async function TrashPage() {
  await requireAdmin();
  const { schools, attempts } = listTrash();
  const btn = "min-h-[40px] rounded-xl bg-[#22211F] px-4 text-sm font-semibold text-white hover:bg-black";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Papelera"
        subtitle="Lo que se borra desde el panel queda acá y no cuenta en los resultados. Nada se borra de verdad: cualquier cosa se puede restaurar."
      />

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Colegios</h2>
        {schools.length === 0 ? (
          <EmptyState>No hay colegios en la papelera.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {schools.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3" style={{ borderColor: C.line }}>
                <div className="flex flex-col">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[13px]" style={{ color: C.muted }}>
                    En la papelera desde {when(s.deleted_at)} · {s.attempts} {s.attempts === 1 ? "prueba" : "pruebas"} (vuelven con el colegio)
                  </span>
                </div>
                <form action={restoreSchoolAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className={btn}>
                    Restaurar colegio
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Pruebas</h2>
        {attempts.length === 0 ? (
          <EmptyState>No hay pruebas en la papelera.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-[20px] border bg-white" style={{ borderColor: C.line }}>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-bold tracking-[0.06em]" style={{ background: "#FAF8F4", color: C.muted }}>
                <tr>
                  {["NOMBRE", "COLEGIO", "GRADO", "PUNTAJE", "FECHA", "EN LA PAPELERA DESDE", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: "#F0EDE6" }}>
                    <td className="px-3 py-2.5 font-semibold">
                      <Link href={`/admin/estudiantes/${a.id}`} className="text-[#22211F] underline decoration-[#C9C3B6] underline-offset-2">
                        {a.student_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      {a.school_name}
                      {a.school_deleted && <span style={{ color: C.muted }}> (colegio en la papelera)</span>}
                    </td>
                    <td className="px-3 py-2.5">{a.grade}.º</td>
                    <td className="px-3 py-2.5 tabular-nums">{a.score !== null ? `${a.score}/${testOf(a.grade).max}` : "–"}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{when(a.started_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{a.deleted_at ? when(a.deleted_at) : "–"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <form action={restoreAttemptAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className={btn}>
                          Restaurar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
