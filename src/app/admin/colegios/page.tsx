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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[34px] font-semibold">Colegios</h1>
        <p className="m-0 text-[17px] text-[#55504A]">Los nombres que cargás acá son los que ven los chicos en el desplegable de la pantalla inicial. Cargalos antes de la toma. No hay cursos: cada chico elige si es de 4.º o de 6.º al entrar.</p>
      </div>

      <form action={createSchoolAction} className="flex flex-wrap items-end gap-2 rounded-2xl border border-[#E5E1D8] bg-white p-4">
        <label className="text-[13px] font-semibold text-[#55504A]">
          Nuevo colegio
          <br />
          <input name="name" required minLength={2} maxLength={80} className={`${input} w-72`} placeholder="Ej.: Escuela N.º 12 Sarmiento" />
        </label>
        <button type="submit" className={btn}>
          Agregar colegio
        </button>
      </form>

      {schools.length === 0 && <p className="text-[#55504A]">Todavía no hay colegios.</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {schools.map((s) => (
          <section key={s.id} className="rounded-[20px] border border-[#E5E1D8] bg-white p-5">
            <form action={renameSchoolAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} className={`${input} flex-1 font-semibold`} />
              <button type="submit" className="min-h-[40px] rounded-xl px-3 text-sm font-semibold text-[#3D3A35] hover:bg-[#EFEBE3]">
                Renombrar
              </button>
            </form>
            <p className="mt-1 text-xs text-[#6B665E]">
              4.º: {counts[s.id]?.["4"] ?? 0} {(counts[s.id]?.["4"] ?? 0) === 1 ? "prueba" : "pruebas"} · 6.º: {counts[s.id]?.["6"] ?? 0} {(counts[s.id]?.["6"] ?? 0) === 1 ? "prueba" : "pruebas"}
            </p>
            <form action={deleteSchoolAction} className="mt-4 border-t border-[#F0EDE6] pt-3">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton message={`¿Borrar el colegio ${s.name} con todas sus pruebas? Esta acción no se puede deshacer.`} className="text-xs text-red-700 hover:underline">
                Borrar colegio
              </ConfirmButton>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
