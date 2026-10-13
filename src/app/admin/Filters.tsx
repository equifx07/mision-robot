import type { Filters } from "@/lib/dashboard";
import type { School } from "@/lib/repo";
import { courseLabel } from "@/lib/divisions";
import { testOf } from "@/lib/tests";

/** Fila de filtros (formulario GET). El grado se elige en el menú lateral y viaja oculto. */
export function FiltersBar({ filters, schools, action, compare = true }: { filters: Filters; schools: School[]; action: string; compare?: boolean }) {
  const sel = "mt-1 min-h-[40px] rounded-xl border border-[#D8D3C8] bg-white px-3 text-[15px] text-[#22211F]";
  const label = "flex flex-col text-[13px] font-semibold text-[#55504A]";
  const test = testOf(filters.grade);
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E5E1D8] bg-white p-4">
      <input type="hidden" name="grado" value={filters.grade} />
      <div className="flex min-h-[40px] flex-col justify-end">
        <span className="text-[13px] font-semibold text-[#55504A]">Prueba</span>
        <span className="mt-1 inline-flex min-h-[40px] items-center rounded-xl bg-[#22211F] px-3 text-[15px] font-semibold text-white">
          {test.label} · {test.max} misiones
        </span>
      </div>
      <label className={label}>
        Colegio
        <select name="colegio" defaultValue={filters.schoolId ? (filters.division ? `${filters.schoolId}:${filters.division}` : filters.schoolId) : ""} className={sel}>
          <option value="">Todos</option>
          {schools.map((s) =>
            s.divisions.length ? (
              <optgroup key={s.id} label={s.name}>
                <option value={s.id}>{s.name} (todos los cursos)</option>
                {s.divisions.map((d) => (
                  <option key={d} value={`${s.id}:${d}`}>
                    {s.name} · {courseLabel(filters.grade, d)}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ),
          )}
        </select>
      </label>
      {compare && (
        <label className={label}>
          Comparar
        <select name="por" defaultValue={filters.groupBy ?? "colegio"} className={sel}>
          <option value="colegio">Colegios</option>
          <option value="curso">Cursos</option>
        </select>
        </label>
      )}
      <label className={label}>
        Experiencia previa
        <select name="exp" defaultValue={filters.priorExp ?? ""} className={sel}>
          <option value="">Todas</option>
          <option value="nunca">Nunca</option>
          <option value="algunas">Algunas veces</option>
          <option value="siempre">Todos los años</option>
        </select>
      </label>
      <label className="flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[#55504A]">
        <input type="checkbox" name="todos" value="1" defaultChecked={filters.includeUnfinished} className="h-4 w-4 accent-[#22211F]" /> Incluir pruebas sin terminar
      </label>
      <button type="submit" className="min-h-[40px] rounded-xl bg-[#22211F] px-4 text-[15px] font-semibold text-white hover:bg-black">
        Aplicar
      </button>
      <a href={`${action}?grado=${filters.grade}`} className="min-h-[40px] content-center text-sm text-[#55504A] underline">
        Limpiar
      </a>
    </form>
  );
}
