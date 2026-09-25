import type { Filters } from "@/lib/dashboard";
import type { School } from "@/lib/repo";

/** Fila de filtros (formulario GET). */
export function FiltersBar({ filters, schools, action }: { filters: Filters; schools: School[]; action: string }) {
  const sel = "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm";
  const courses = schools.find((s) => s.id === filters.schoolId)?.courses ?? [];
  return (
    <form method="get" action={action} className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/10">
      <label className="text-xs font-semibold text-slate-600">
        Colegio
        <br />
        <select name="colegio" defaultValue={filters.schoolId ?? ""} className={sel}>
          <option value="">Todos</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-600">
        Curso
        <br />
        <select name="curso" defaultValue={filters.courseId ?? ""} className={sel} disabled={!filters.schoolId}>
          <option value="">Todos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-600">
        Experiencia previa
        <br />
        <select name="exp" defaultValue={filters.priorExp ?? ""} className={sel}>
          <option value="">Todas</option>
          <option value="nunca">Nunca</option>
          <option value="algunas">Algunas veces</option>
          <option value="siempre">Todos los años</option>
        </select>
      </label>
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
        <input type="checkbox" name="todos" value="1" defaultChecked={filters.includeUnfinished} /> incluir pruebas sin terminar
      </label>
      <button type="submit" className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white">
        Aplicar
      </button>
      <a href={action} className="text-sm text-slate-500 underline">
        Limpiar
      </a>
    </form>
  );
}
