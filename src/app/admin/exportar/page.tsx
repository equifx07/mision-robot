import { requireAdmin } from "@/lib/auth";
import { GRADES, testOf } from "@/lib/tests";

export const dynamic = "force-dynamic";

const FILES = [
  {
    tipo: "estudiantes",
    title: "Estudiantes (una fila por prueba)",
    text: "Datos del estudiante, puntaje total y por parte, acierto por concepto y práctica, nivel, tiempo total y resolviendo misiones, señales de atención (respuestas apuradas, caída y ritmo al final) y dispositivo.",
  },
  {
    tipo: "respuestas",
    title: "Respuestas (una fila por estudiante y misión)",
    text: "Formato largo para análisis estadístico: misión, posición, dimensión, tarea, opción elegida, acierto, tiempo, tiempo típico de la misión y si la respuesta fue apurada.",
  },
  { tipo: "items", title: "Misiones de la prueba", text: "Las misiones de la prueba con su posición, dimensión, tarea y opción correcta, para documentar el instrumento." },
];

export default async function ExportPage() {
  await requireAdmin();
  const link = "inline-flex min-h-[40px] items-center rounded-xl bg-[#22211F] px-4 text-[15px] font-semibold text-white no-underline hover:bg-black";
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[34px] font-semibold">Exportar datos</h1>
        <p className="m-0 text-[17px] text-[#55504A]">
          Archivos CSV separados por punto y coma, con coma decimal, listos para abrir en Excel o Google Sheets en español. Cada archivo es de una sola prueba, porque 4.º y 6.º tienen misiones distintas.
        </p>
      </div>
      {FILES.map((f) => (
        <section key={f.tipo} className="flex flex-col gap-3 rounded-[20px] border border-[#E5E1D8] bg-white p-5">
          <div>
            <h2 className="m-0 text-lg font-bold">{f.title}</h2>
            <p className="mb-0 mt-1 text-sm text-[#55504A]">{f.text}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <a key={g} className={link} href={`/api/admin/export?tipo=${f.tipo}&grado=${g}`}>
                Descargar {testOf(g).label}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
