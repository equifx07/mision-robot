import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { fmt, levelOf, MAX_SCORE } from "@/lib/stats";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const EXP: Record<string, string> = { nunca: "Nunca", algunas: "Algunas veces", siempre: "Todos los años" };
const STATUS: Record<string, string> = { finished: "Terminada", timed_out: "Sin tiempo", in_progress: "En curso" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard({ ...filters, includeUnfinished: true });
  const rows = d.scored.filter((r) => filters.includeUnfinished || r.attempt.status !== "in_progress");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Estudiantes</h1>
        <p className="text-sm text-slate-500">Una fila por prueba. Hacé clic en un nombre para ver el detalle ítem por ítem.</p>
      </div>
      <FiltersBar filters={filters} schools={d.schools} action="/admin/estudiantes" />
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/10">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {["Nombre", "Colegio", "Curso", "Fecha", "Estado", "Total", "Parte A", "Parte B", "Nivel", "Tiempo", "Edad", "Exp. previa", "Dispositivo"].map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const a = r.attempt;
              const finished = a.status !== "in_progress";
              return (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-semibold">
                    <Link href={`/admin/estudiantes/${a.id}`} className="text-blue-700 hover:underline">
                      {a.student_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{a.school_name}</td>
                  <td className="px-3 py-2">{a.course_name}</td>
                  <td className="px-3 py-2 tabular-nums">{new Date(a.started_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-3 py-2">{STATUS[a.status] ?? a.status}</td>
                  <td className="px-3 py-2 tabular-nums font-semibold">{finished ? `${r.total}/${MAX_SCORE}` : "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{finished ? `${a.score_a ?? 0}/20` : "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{finished ? `${a.score_b ?? 0}/8` : "–"}</td>
                  <td className="px-3 py-2">{finished ? levelOf(r.total).name : "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{a.total_ms ? `${fmt(a.total_ms / 60000, 0)} min` : "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{a.age ?? "–"}</td>
                  <td className="px-3 py-2">{a.prior_exp ? EXP[a.prior_exp] : "–"}</td>
                  <td className="px-3 py-2">{a.device ?? "–"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-slate-500">
                  No hay pruebas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">{rows.length} prueba(s).</p>
    </div>
  );
}
