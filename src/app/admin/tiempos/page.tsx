import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { itemTimeInsight, rightWrongInsight, schoolTimeInsight, totalTimeInsight } from "@/lib/insights";
import { itemTimes, loadReference, testMinutes, timeStats } from "@/lib/patrones";
import { TIME_BINS, timeBin } from "@/lib/semaforo";
import { fmt, median, pct } from "@/lib/stats";
import { ToneHeatmap } from "@/components/admin/charts";
import { ItemTimeChart, MinutesBoxes, RightWrongChart } from "@/components/admin/charts-misiones";
import { Card, EmptyState, ExplainedSection, Kpi, PageHeader, ScaleLegend, SectionIndex } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const chicos = (n: number) => `${n} ${n === 1 ? "chico" : "chicos"}`;

export default async function TimesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const n = d.scored.length;
  const ref = loadReference(d.test);
  const groups = [...d.bySchool].sort((a, b) => a.school.name.localeCompare(b.school.name));
  const many = groups.length > 1;

  const minutesOf = (name: string, rows: typeof d.scored) => {
    const m = testMinutes(rows);
    return { name, n: rows.length, total: timeStats(m.total), missions: timeStats(m.missions) };
  };
  const all = minutesOf("Todos", d.scored);
  const bySchool = groups.map((g) => minutesOf(g.school.name, g.scored));
  const explain = d.scored
    .map((r) => {
      const sum = d.test.items.reduce((a, it) => a + (r.times[it.id] ?? 0), 0);
      return r.totalTimeMs && sum ? (r.totalTimeMs - sum) / 60000 : NaN;
    })
    .filter((x) => Number.isFinite(x) && x >= 0);

  const times = itemTimes(d.scored, ref);
  const allMedians = times.map((t) => t.all.median);
  const slowest = [...times].filter((t) => Number.isFinite(t.all.median)).sort((a, b) => b.all.median - a.all.median)[0];
  const schoolRows = groups.map((g) => ({ name: g.school.name, n: g.scored.length, values: itemTimes(g.scored, ref).map((t) => t.all.median) }));

  return (
    <>
      <PageHeader title="Tiempos" subtitle="Cuánto tardan los chicos en toda la prueba y en cada misión, una por una. El tiempo no es bueno ni malo por sí solo: sirve para entender los resultados." />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/tiempos" />

      {n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Prueba completa" value={fmt(all.total.median, 0)} unit="min" chip={{ tone: "neutro", label: "Mediana" }} sub={`La mitad central tardó de ${fmt(all.total.q1, 0)} a ${fmt(all.total.q3, 0)} min. No hay límite de tiempo.`} />
            <Kpi label="Resolviendo misiones" value={fmt(all.missions.median, 0)} unit="min" chip={{ tone: "neutro", label: "Mediana" }} sub={`La suma de lo que tardó en las ${d.test.max} misiones.`} />
            <Kpi label="Explicación y prácticas" value={explain.length ? fmt(median(explain), 0) : "–"} unit="min" chip={{ tone: "neutro", label: "Aproximado" }} sub="Lo que queda de la prueba completa al sacar las misiones." />
            <Kpi
              label="Misión que más tiempo lleva"
              value={slowest ? slowest.id : "–"}
              chip={{ tone: "neutro", label: slowest ? `${fmt(slowest.all.median, 0)} s` : "Sin datos" }}
              sub="Tiempo típico (mediana) de esa misión."
            />
          </div>

          <SectionIndex
            items={[
              { id: "total", label: "Toda la prueba" },
              { id: "por-mision", label: "Misión por misión" },
              { id: "por-colegio", label: "Por colegio" },
              { id: "acierto", label: "Tiempo y acierto" },
            ]}
          />

          <ExplainedSection
            id="total"
            kicker="1 · TODA LA PRUEBA"
            question="¿Cuánto tardan en hacer toda la prueba?"
            muestra="Los minutos que tardó cada chico, en total y por colegio. La caja oscura es la prueba completa; la clara, solo el tiempo resolviendo misiones."
            medicion="Prueba completa: desde que el chico empieza (después de poner sus datos) hasta que termina la última misión (no hay límite de tiempo); incluye la explicación y las prácticas. Resolviendo misiones: la suma de lo que tardó en cada misión. Se usa la mediana (el chico del medio) porque unos pocos muy lentos o muy rápidos moverían mucho el promedio."
            observa={totalTimeInsight(all, bySchool)}
          >
            <Card>
              <MinutesBoxes rows={[{ label: "Todos", sub: chicos(n), total: all.total, missions: all.missions }, ...(many ? bySchool.map((s) => ({ label: s.name, sub: chicos(s.n), total: s.total, missions: s.missions })) : [])]} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="por-mision"
            kicker="2 · MISIÓN POR MISIÓN"
            question="¿Cuánto tardan en cada misión?"
            wide
            muestra="Una columna por misión, en el orden de la prueba. La barra es el tiempo del chico típico; la línea, lo que tardó la mitad central de los chicos. Debajo de cada misión, sus segundos."
            medicion="Tiempo de una misión: desde que aparece en la pantalla hasta que el chico toca Confirmar. No incluye la explicación ni la práctica que vienen antes de algunas misiones. Si el chico recarga la página, el tiempo sigue contando desde que la misión apareció por primera vez."
            observa={itemTimeInsight(times)}
          >
            <Card>
              <ItemTimeChart times={times} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="por-colegio"
            kicker="3 · POR COLEGIO"
            question="¿Algún colegio tarda más en ciertas misiones?"
            wide
            muestra="El tiempo típico de cada misión en cada colegio, en segundos. Cuanto más oscuro, más tiempo."
            medicion="Mediana de los segundos de los chicos de cada colegio en cada misión. Tardar más no es bueno ni malo por sí solo: conviene mirarlo junto con el acierto (en Conceptos y prácticas)."
            observa={schoolTimeInsight(schoolRows, allMedians)}
          >
            <Card className="flex flex-col gap-5">
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <ToneHeatmap
                    compact
                    labelWidth={170}
                    columns={d.test.ids}
                    groups={[
                      {
                        rows: [
                          { label: "Todos", sub: chicos(n), values: allMedians },
                          ...(many ? schoolRows.map((s) => ({ label: s.name, sub: chicos(s.n), values: s.values })) : []),
                        ],
                      },
                    ]}
                    cell={(v) => {
                      const b = timeBin(v);
                      return { fill: b.fill, text: b.text, label: b.label, value: fmt(v, 0) };
                    }}
                  />
                </div>
              </div>
              <ScaleLegend title="Segundos (mediana)" items={TIME_BINS.map((b) => ({ fill: b.fill, label: b.label }))} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="acierto"
            kicker="4 · TIEMPO Y ACIERTO"
            question="¿Los que se equivocan tardan más o menos que los que aciertan?"
            wide
            muestra="Para cada misión, el tiempo típico de los que la acertaron (verde) y el de los que se equivocaron (rojo)."
            medicion="Mediana de los segundos de cada grupo, sin contar las respuestas apuradas (esas se analizan en Errores y atención). Si los que se equivocan tardan más, la misión los trabó; si tardan menos, la contestaron sin pensarla del todo."
            observa={rightWrongInsight(times)}
          >
            <Card>
              <RightWrongChart times={times} />
            </Card>
          </ExplainedSection>
        </>
      )}
    </>
  );
}
