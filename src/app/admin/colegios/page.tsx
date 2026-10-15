import { requireAdmin } from "@/lib/auth";
import { countAttemptsBySchool, listSchools } from "@/lib/repo";
import { createSchoolAction, deleteSchoolAction, renameSchoolAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  await requireAdmin();
  const schools = listSchools();
  const counts = countAttemptsBySchool();
  const input = "min-h-[40px] rounded-xl border border-[#D8D3C8] bg-white px-3 text-[15px]";
  const btn = "min-h-[40px] rounded-xl bg-[#22211F] px-4 text-[15px] font-semibold text-white hover:bg-black";
  const small = "text-[13px] font-semibold text-[#55504A]";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[34px] font-semibold">Colegios</h1>
        <p className="m-0 text-[17px] text-[#55504A]">
          Los nombres que cargás acá son los que ven los chicos en el desplegable de la pantalla inicial. Cargalos antes de la toma. Cada chico elige su grado (4.º, 5.º o 6.º) y, si el colegio tiene cursos, en cuál está.
        </p>
      </div>

      <form action={createSchoolAction} className="flex flex-wrap items-end gap-2 rounded-2xl border border-[#E5E1D8] bg-white p-4">
        <label className={small}>
          Nuevo colegio
          <br />
          <input name="name" required minLength={2} maxLength={80} className={`${input} w-72`} placeholder="Ej.: Escuela N.º 12 Sarmiento" />
        </label>
        <label className={small}>
          Cursos (opcional)
          <br />
          <input name="divisions" maxLength={60} className={`${input} w-40`} placeholder="Ej.: A, B, C" />
        </label>
        <button type="submit" className={btn}>
          Agregar colegio
        </button>
      </form>

      {schools.length === 0 && <p className="text-[#55504A]">Todavía no hay colegios.</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {schools.map((s) => (
          <section key={s.id} className="rounded-[20px] border border-[#E5E1D8] bg-white p-5">
            <form action={renameSchoolAction} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} aria-label="Nombre del colegio" className={`${input} font-semibold`} />
              <div className="flex flex-wrap items-end gap-2">
                <label className={`${small} flex-1`}>
                  Cursos (los mismos para 4.º, 5.º y 6.º)
                  <input name="divisions" defaultValue={s.divisions.join(", ")} maxLength={60} placeholder="Sin cursos" className={`${input} mt-1 w-full`} />
                </label>
                <button type="submit" className="min-h-[40px] rounded-xl border border-[#D8D3C8] px-3 text-sm font-semibold text-[#3D3A35] hover:bg-[#EFEBE3]">
                  Guardar
                </button>
              </div>
            </form>
            <p className="mt-2 text-xs text-[#6B665E]">
              {s.divisions.length ? `Los chicos eligen su curso: ${s.divisions.join(", ")}. ` : "Sin cursos: los chicos solo eligen el grado. "}
              {(["4", "5", "6"] as const).map((g) => `${g}.º: ${counts[s.id]?.[g] ?? 0} ${(counts[s.id]?.[g] ?? 0) === 1 ? "prueba" : "pruebas"}`).join(" · ")}
            </p>
            <form action={deleteSchoolAction} className="mt-4 border-t border-[#F0EDE6] pt-3">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton message={`¿Mandar el colegio ${s.name} a la papelera? Deja de verse con todas sus pruebas. Se puede recuperar desde la Papelera.`} className="text-xs text-red-700 hover:underline">
                Mandar a la papelera
              </ConfirmButton>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
