import type { Filters } from "@/lib/dashboard";
import type { School } from "@/lib/repo";

/** Fila de filtros (formulario GET). */
export function FiltersBar({ filters, schools, action }: { filters: Filters; schools: School[]; action: string }) {
  const sel = "mt-1 min-h-[40px] rounded-xl border border-[#D8D3C8] bg-white px-3 text-[15px] text-[#22211F]";
  const label = "flex flex-col text-[13px] font-semibold text-[#55504A]";
  const courses = schools.find((s) => s.id === filters.schoolId)?.courses ?? [];
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E5E1D8] bg-white p-4">
      <label className={label}>
        Colegio
        <select name="colegio" defaultValue={filters.schoolId ?? ""} className={sel}>
          <option value="">Todos</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Curso
        <select name="curso" defaultValue={filters.courseId ?? ""} className={sel} disabled={!filters.schoolId}>
          <option value="">{filters.schoolId ? "Todos" : "Elegí un colegio"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
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
      <a href={action} className="min-h-[40px] content-center text-sm text-[#55504A] underline">
        Limpiar
      </a>
    </form>
  );
}
