import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { LEVEL_TONE } from "@/lib/semaforo";
import { fmt, levelOf, MAX_SCORE } from "@/lib/stats";
import { C, Chip, PageHeader } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const EXP: Record<string, string> = { nunca: "Nunca", algunas: "Algunas veces", siempre: "Todos los años" };
const STATUS: Record<string, string> = { finished: "Terminada", timed_out: "Sin tiempo", in_progress: "En curso" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard({ ...filters, includeUnfinished: true });
  const rows = d.scored.filter((r) => filters.includeUnfinished || r.attempt.status !== "in_progress");
  const head = ["Nombre", "Colegio", "Curso", "Fecha", "Estado", "Total", "Parte A", "Parte B", "Nivel", "Tiempo", "Edad", "Exp. previa", "Dispositivo"];

  return (
    <>
      <PageHeader title="Estudiantes" subtitle="Una fila por prueba. Tocá un nombre para ver el detalle misión por misión." />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/estudiantes" />
      <div className="overflow-x-auto rounded-[20px] border bg-white" style={{ borderColor: C.line }}>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs font-bold tracking-[0.06em]" style={{ background: "#FAF8F4", color: C.muted }}>
            <tr>
              {head.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3">
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const a = r.attempt;
              const finished = a.status !== "in_progress";
              const lv = levelOf(r.total);
              return (
                <tr key={a.id} className="border-t hover:bg-[#FAF8F4]" style={{ borderColor: "#F0EDE6" }}>
                  <td className="px-3 py-2.5 font-semibold">
                    <Link href={`/admin/estudiantes/${a.id}`} className="text-[#22211F] underline decoration-[#C9C3B6] underline-offset-2 hover:decoration-[#22211F]">
                      {a.student_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">{a.school_name}</td>
                  <td className="px-3 py-2.5">{a.course_name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{new Date(a.started_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-3 py-2.5">{STATUS[a.status] ?? a.status}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{finished ? `${r.total}/${MAX_SCORE}` : "–"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{finished ? `${a.score_a ?? 0}/20` : "–"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{finished ? `${a.score_b ?? 0}/8` : "–"}</td>
                  <td className="px-3 py-2.5">{finished ? <Chip tone={LEVEL_TONE[lv.key]}>{lv.name}</Chip> : "–"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.total_ms ? `${fmt(a.total_ms / 60000, 0)} min` : "–"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.age ?? "–"}</td>
                  <td className="px-3 py-2.5">{a.prior_exp ? EXP[a.prior_exp] : "–"}</td>
                  <td className="px-3 py-2.5">{a.device ?? "–"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={head.length} className="px-3 py-6 text-center" style={{ color: C.secondary }}>
                  No hay pruebas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs" style={{ color: C.muted }}>
        {rows.length} {rows.length === 1 ? "prueba" : "pruebas"}.
      </p>
    </>
  );
}
