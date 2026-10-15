import { requireAdmin } from "@/lib/auth";
import { listBackups } from "@/lib/backup";
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
  const backups = listBackups();
  const mb = (n: number) => `${(n / 1024 / 1024).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`;
  const link = "inline-flex min-h-[40px] items-center rounded-xl bg-[#22211F] px-4 text-[15px] font-semibold text-white no-underline hover:bg-black";
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[34px] font-semibold">Exportar y copias de seguridad</h1>
        <p className="m-0 text-[17px] text-[#55504A]">
          Archivos CSV separados por punto y coma, con coma decimal, listos para abrir en Excel o Google Sheets en español. Cada archivo es de un solo grado (4.º y 5.º hacen las mismas misiones, pero sus resultados van aparte).
        </p>
      </div>
      <section className="flex flex-col gap-3 rounded-[20px] border-2 border-[#22211F] bg-white p-5">
        <div>
          <h2 className="m-0 text-lg font-bold">Copia de seguridad completa</h2>
          <p className="mb-0 mt-1 text-sm text-[#55504A]">
            Toda la base de datos en un solo archivo (.db): colegios, pruebas, respuestas y tiempos, incluida la papelera. Es lo que hace falta para recuperar todo si el servidor fallara.
          </p>
          <p className="mb-0 mt-2 rounded-xl bg-[#FCF1C4] px-3 py-2 text-sm font-semibold text-[#6E5600]">
            Después de cada toma, bajá una copia y guardala fuera del servidor (por ejemplo, en Google Drive).
          </p>
        </div>
        <div>
          <a className={link} href="/api/admin/backup">
            Descargar copia de seguridad (ahora)
          </a>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-[#3D3A35]">
            Copias automáticas guardadas en el servidor ({backups.length})
          </summary>
          <p className="mb-2 mt-2 text-[13px] text-[#55504A]">
            Se hace una al arrancar la app y una por hora si hubo cambios. Se guardan todas las de 7 días y una por día hasta 90 días.
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {backups.slice(0, 30).map((b) => (
              <li key={b.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F6F4EF] px-3 py-2 text-sm">
                <span className="tabular-nums">
                  {b.date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })} · {mb(b.size)}
                </span>
                <a href={`/api/admin/backup?archivo=${encodeURIComponent(b.name)}`} className="font-semibold text-[#22211F] underline underline-offset-2">
                  Descargar
                </a>
              </li>
            ))}
            {backups.length === 0 && <li className="text-sm text-[#6B665E]">Todavía no hay copias automáticas.</li>}
          </ul>
        </details>
      </section>
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
