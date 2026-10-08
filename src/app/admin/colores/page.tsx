import { requireAdmin } from "@/lib/auth";
import { D_SCALE, SCALE, TONE_MEANING, TONES } from "@/lib/semaforo";
import { TESTS } from "@/lib/tests";

/** "Inicial (4.º 0–7 · 6.º 0–8)": los cortes de cada prueba. */
const lvl = (i: number) => {
  const l4 = TESTS["4"].levels[i];
  const l6 = TESTS["6"].levels[i];
  return `${l4.name} (4.º ${l4.min}–${l4.max} · 6.º ${l6.min}–${l6.max})`;
};
import { C, Chip, HEADING, PageHeader, ScaleLegend } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

// Umbrales de cada medida, en el orden de SCALE (crítico → muy bien). "" = ese color no se usa.
const RULES: { name: string; where: string; cells: string[] }[] = [
  { name: "Nivel de desempeño", where: `Puntaje de un chico o promedio de un grupo (4.º: 0 a ${TESTS["4"].max} · 6.º: 0 a ${TESTS["6"].max})`, cells: ["", lvl(0), "", lvl(1), lvl(2), lvl(3)] },
  { name: "Porcentaje de acierto", where: "Conceptos, prácticas, tareas y misiones", cells: ["menos de 30%", "30 a 44%", "45 a 59%", "60 a 74%", "75 a 89%", "90% o más"] },
  { name: "Cuánto separa una misión", where: "Discriminación, en Calidad de las misiones", cells: ["negativa", "0 a 0,19", "", "0,20 a 0,29", "0,30 a 0,39", "0,40 o más"] },
  { name: "Confiabilidad de la prueba", where: "Alfa de Cronbach, en el Resumen", cells: ["", "menos de 0,60", "0,60 a 0,69", "0,70 a 0,79", "0,80 a 0,89", "0,90 o más"] },
  { name: "Respuestas apuradas", where: "Porcentaje, en Errores y atención (menos es mejor)", cells: ["25% o más", "15 a 24%", "10 a 14%", "6 a 9%", "3 a 5%", "menos de 3%"] },
  { name: "Por qué se equivocan", where: "Diagnóstico de cada misión, en Errores y atención", cells: ["", "Más difícil que la línea", "Errores por apuro", "", "Más fácil que la línea", ""] },
  { name: "Señales de atención", where: "Cada chico, en Errores y atención y en su ficha", cells: ["", "Varias señales", "", "Una señal", "Sin señales", ""] },
];

export default async function ColorsPage() {
  await requireAdmin();
  const cols = "grid grid-cols-[230px_repeat(6,minmax(0,1fr))] items-center gap-1.5";
  return (
    <>
      <PageHeader
        title="Cómo leer los colores"
        subtitle="Todo el panel usa el mismo semáforo: del rojo oscuro (lo peor) al verde oscuro (lo mejor). El color siempre va con su número o una etiqueta, así se entiende también sin color."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {SCALE.map((t) => (
          <div key={t} className="flex flex-col overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: C.line }}>
            <div className={`${HEADING} flex h-[88px] items-end px-3.5 py-3 text-[22px] font-semibold`} style={{ background: TONES[t].fill, color: TONES[t].text }}>
              {TONES[t].label}
            </div>
            <p className="m-0 px-3.5 pb-3.5 pt-3 text-sm leading-snug" style={{ color: C.ink2 }}>
              {TONE_MEANING[t]}
            </p>
          </div>
        ))}
      </div>

      <section aria-labelledby="umbrales" className="flex flex-col gap-1 overflow-x-auto rounded-[20px] border bg-white px-6 py-5" style={{ borderColor: C.line }}>
        <h2 id="umbrales" className={`${HEADING} m-0 mb-2 text-2xl font-semibold`}>
          Dónde empieza cada color
        </h2>
        <div className="min-w-[900px]">
          <div className={cols}>
            <span />
            {SCALE.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[13px] font-bold">
                <span className="h-3 w-3 rounded-sm" style={{ background: TONES[t].fill }} />
                {TONES[t].label}
              </span>
            ))}
          </div>
          {RULES.map((r) => (
            <div key={r.name} className={`${cols} min-h-[52px] border-t py-1`} style={{ borderColor: "#F0EDE6" }}>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold">{r.name}</span>
                <span className="text-xs" style={{ color: C.muted }}>
                  {r.where}
                </span>
              </div>
              {r.cells.map((text, i) => {
                const t = TONES[SCALE[i]];
                return (
                  <span key={i} className="rounded-[10px] px-2.5 py-2 text-sm font-semibold" style={text ? { background: t.tint, color: t.ink } : { background: C.page, color: "#8F897F" }}>
                    {text || "—"}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="comparar" className="flex flex-col gap-3 rounded-[20px] border bg-white px-6 py-5" style={{ borderColor: C.line }}>
          <h2 id="comparar" className={`${HEADING} m-0 text-[22px] font-semibold`}>
            Al comparar dos colegios
          </h2>
          <p className="m-0 text-sm leading-relaxed" style={{ color: C.ink2 }}>
            Ahí el color dice si la fila rinde más o menos que la columna. En el medio va gris: son parecidos, no es ni bueno ni malo.
          </p>
          <ScaleLegend items={D_SCALE} />
        </section>
        <section aria-labelledby="sin" className="flex flex-col gap-3 rounded-[20px] border bg-white px-6 py-5" style={{ borderColor: C.line }}>
          <h2 id="sin" className={`${HEADING} m-0 text-[22px] font-semibold`}>
            Lo que no lleva semáforo
          </h2>
          <p className="m-0 text-sm leading-relaxed" style={{ color: C.ink2 }}>
            La cantidad de chicos, los tiempos, la edad y los demás datos de contexto van en gris: no son ni buenos ni malos. En Tiempos, cuanto más oscuro el gris, más segundos. Las misiones que «siguen la línea» también van en gris. La única excepción es el aviso de «Pocos datos» cuando hay menos de 30 chicos, que va en amarillo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip tone="neutro">Dato de contexto</Chip>
            <Chip tone="intermedio">Pocos datos</Chip>
          </div>
        </section>
      </div>
    </>
  );
}
