import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  await requireAdmin();
  const link = "inline-block rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700";
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Exportar datos</h1>
        <p className="text-sm text-slate-500">Archivos CSV separados por punto y coma, con coma decimal, listos para abrir en Excel o Google Sheets en español.</p>
      </div>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <h2 className="font-semibold text-slate-900">Estudiantes (una fila por prueba)</h2>
        <p className="mb-3 text-sm text-slate-600">Datos del estudiante, puntaje total y por parte, acierto por concepto y práctica, nivel, tiempos y dispositivo.</p>
        <a className={link} href="/api/admin/export?tipo=estudiantes">
          Descargar estudiantes.csv
        </a>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <h2 className="font-semibold text-slate-900">Respuestas (una fila por estudiante e ítem)</h2>
        <p className="mb-3 text-sm text-slate-600">Formato largo para análisis estadístico: ítem, dimensión, tarea, opción elegida, acierto y tiempo.</p>
        <a className={link} href="/api/admin/export?tipo=respuestas">
          Descargar respuestas.csv
        </a>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <h2 className="font-semibold text-slate-900">Banco de ítems</h2>
        <p className="mb-3 text-sm text-slate-600">Lista de ítems con dimensión, tarea y opción correcta, para documentar el instrumento.</p>
        <a className={link} href="/api/admin/export?tipo=items">
          Descargar items.csv
        </a>
      </section>
    </div>
  );
}
