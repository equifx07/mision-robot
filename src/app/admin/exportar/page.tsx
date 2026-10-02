import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  await requireAdmin();
  const link = "inline-block rounded-xl bg-[#22211F] px-4 py-2.5 text-[15px] font-semibold text-white no-underline hover:bg-black";
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[34px] font-semibold">Exportar datos</h1>
        <p className="m-0 text-[17px] text-[#55504A]">Archivos CSV separados por punto y coma, con coma decimal, listos para abrir en Excel o Google Sheets en español.</p>
      </div>
      <section className="rounded-[20px] border border-[#E5E1D8] bg-white p-5">
        <h2 className="m-0 text-lg font-bold">Estudiantes (una fila por prueba)</h2>
        <p className="mb-3 mt-1 text-sm text-[#55504A]">Datos del estudiante, puntaje total y por parte, acierto por concepto y práctica, nivel, tiempo total y resolviendo misiones, señales de atención (respuestas apuradas, caída y ritmo al final) y dispositivo.</p>
        <a className={link} href="/api/admin/export?tipo=estudiantes">
          Descargar estudiantes.csv
        </a>
      </section>
      <section className="rounded-[20px] border border-[#E5E1D8] bg-white p-5">
        <h2 className="m-0 text-lg font-bold">Respuestas (una fila por estudiante e ítem)</h2>
        <p className="mb-3 mt-1 text-sm text-[#55504A]">Formato largo para análisis estadístico: ítem, posición, dimensión, tarea, opción elegida, acierto, tiempo, tiempo típico de la misión y si la respuesta fue apurada.</p>
        <a className={link} href="/api/admin/export?tipo=respuestas">
          Descargar respuestas.csv
        </a>
      </section>
      <section className="rounded-[20px] border border-[#E5E1D8] bg-white p-5">
        <h2 className="m-0 text-lg font-bold">Banco de ítems</h2>
        <p className="mb-3 mt-1 text-sm text-[#55504A]">Lista de ítems con dimensión, tarea y opción correcta, para documentar el instrumento.</p>
        <a className={link} href="/api/admin/export?tipo=items">
          Descargar items.csv
        </a>
      </section>
    </div>
  );
}
