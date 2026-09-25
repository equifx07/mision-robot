import { requireAdmin } from "@/lib/auth";
import { countAttemptsBySchool, listSchools } from "@/lib/repo";
import { createCourseAction, createSchoolAction, deleteCourseAction, deleteSchoolAction, renameSchoolAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  await requireAdmin();
  const schools = listSchools();
  const counts = countAttemptsBySchool();
  const input = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";
  const btn = "rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Colegios y cursos</h1>
        <p className="text-sm text-slate-500">Los nombres que cargás acá son los que ven los chicos en el desplegable de la pantalla inicial. Cargalos antes de la toma.</p>
      </div>

      <form action={createSchoolAction} className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <label className="text-xs font-semibold text-slate-600">
          Nuevo colegio
          <br />
          <input name="name" required minLength={2} maxLength={80} className={`${input} w-72`} placeholder="Ej.: Escuela N.º 12 Sarmiento" />
        </label>
        <button type="submit" className={btn}>
          Agregar colegio
        </button>
      </form>

      {schools.length === 0 && <p className="text-slate-500">Todavía no hay colegios.</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {schools.map((s) => (
          <section key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
            <form action={renameSchoolAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} className={`${input} flex-1 font-semibold`} />
              <button type="submit" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
                Renombrar
              </button>
            </form>
            <p className="mt-1 text-xs text-slate-500">
              {counts[s.id] ?? 0} prueba{(counts[s.id] ?? 0) === 1 ? "" : "s"} registradas
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {s.courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                  <span>{c.name}</span>
                  <form action={deleteCourseAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton message={`¿Borrar el curso ${c.name}? Se borran también sus pruebas.`} className="text-xs text-red-700 hover:underline">
                      borrar
                    </ConfirmButton>
                  </form>
                </li>
              ))}
              {s.courses.length === 0 && <li className="text-sm text-slate-400">Sin cursos todavía.</li>}
            </ul>
            <form action={createCourseAction} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="schoolId" value={s.id} />
              <input name="name" required maxLength={40} className={`${input} w-40`} placeholder="Ej.: 6.º A" />
              <button type="submit" className={btn}>
                Agregar curso
              </button>
            </form>
            <form action={deleteSchoolAction} className="mt-4 border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton message={`¿Borrar el colegio ${s.name} con todos sus cursos y pruebas? Esta acción no se puede deshacer.`} className="text-xs text-red-700 hover:underline">
                Borrar colegio
              </ConfirmButton>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
