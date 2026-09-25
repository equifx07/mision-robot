import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { ITEMS } from "@/lib/items";
import { cohenD, DIMENSIONS, fmt, LEVELS, MAX_SCORE, pct, TASK_LABEL } from "@/lib/stats";
import { BoxPlots, Card, HBars, Heatmap, Histogram, LevelBars, SimpleTable, StatTile } from "@/components/charts/Charts";
import { FiltersBar } from "./Filters";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const s = d.summary;
  const concepts = DIMENSIONS.filter((x) => x.group === "concepto");
  const practices = DIMENSIONS.filter((x) => x.group === "practica");
  const schoolsWithData = d.bySchool;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Resumen</h1>
        <p className="text-sm text-slate-500">Evaluación de Pensamiento Computacional 6.º (Misión Robot). Puntaje máximo {MAX_SCORE}.</p>
      </div>
      <FiltersBar filters={filters} schools={d.schools} action="/admin" />

      {s.n === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-black/10">Todavía no hay pruebas terminadas con estos filtros.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Estudiantes" value={String(s.n)} sub={`${schoolsWithData.length} colegio${schoolsWithData.length === 1 ? "" : "s"}`} />
            <StatTile label="Media" value={fmt(s.mean)} sub={`IC 95%: ${fmt(s.ci[0])} a ${fmt(s.ci[1])}`} />
            <StatTile label="Mediana" value={fmt(s.median, 0)} sub={`Q1 ${fmt(s.q1)} · Q3 ${fmt(s.q3)}`} />
            <StatTile label="Desvío estándar" value={fmt(s.sd)} sub={`mín ${fmt(s.min, 0)} · máx ${fmt(s.max, 0)}`} />
            <StatTile label="Alfa de Cronbach" value={fmt(d.alpha, 2)} sub={`Parte A: ${fmt(d.alphaA, 2)}`} />
            <StatTile label="Tiempo mediano" value={`${fmt(s.medianTimeMin, 0)} min`} sub="de principio a fin" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Distribución de puntajes" subtitle="Cantidad de estudiantes por puntaje total, con las bandas de nivel.">
              <Histogram scores={s.scores} max={MAX_SCORE} levels={LEVELS} />
            </Card>
            <Card
              title="Niveles de desempeño"
              subtitle="Cortes provisorios: Inicial 0-9, En desarrollo 10-16, Logrado 17-22, Avanzado 23-28."
              table={<SimpleTable head={["Nivel", "Estudiantes", "%"]} rows={LEVELS.map((l) => [l.name, s.levels[l.key], pct(s.levels[l.key] / s.n)])} />}
            >
              <LevelBars groups={[{ label: "Todos", counts: LEVELS.map((l) => s.levels[l.key]) }, ...schoolsWithData.map((g) => ({ label: g.school.name, counts: LEVELS.map((l) => g.summary.levels[l.key]) }))]} levelNames={LEVELS.map((l) => l.name)} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card title="Conceptos (Parte A)" subtitle="Proporción de respuestas correctas por concepto." table={<SimpleTable head={["Concepto", "Acierto"]} rows={concepts.map((c) => [c.label, pct(s.dims[c.key])])} />}>
              <HBars rows={concepts.map((c) => ({ label: c.label, value: s.dims[c.key] }))} max={1} width={420} />
            </Card>
            <Card title="Prácticas (Parte B)" subtitle="Proporción de respuestas correctas por práctica." table={<SimpleTable head={["Práctica", "Acierto"]} rows={practices.map((c) => [c.label, pct(s.dims[c.key])])} />}>
              <HBars rows={practices.map((c) => ({ label: c.label, value: s.dims[c.key] }))} max={1} width={420} />
            </Card>
            <Card title="Tipo de tarea (Parte A)" subtitle="Secuenciar, completar, depurar y evaluar.">
              <HBars rows={(["S", "C", "D", "E"] as const).map((t) => ({ label: TASK_LABEL[t], value: s.tasks[t] }))} max={1} width={420} />
            </Card>
          </div>

          <h2 className="mt-2 text-xl font-black text-slate-900">Comparación entre colegios</h2>
          {schoolsWithData.length < 2 && <p className="text-sm text-slate-500">Con los filtros actuales hay datos de un solo colegio. Sacá el filtro de colegio para comparar.</p>}

          <Card
            title="Puntaje medio por colegio"
            subtitle="Barras: media. Bigotes: intervalo de confianza del 95% (con pocos estudiantes el intervalo es amplio)."
            table={
              <SimpleTable
                head={["Colegio", "n", "Media", "IC 95%", "Mediana", "DE", "Mín", "Máx", "Tiempo mediano"]}
                rows={schoolsWithData.map((g) => [
                  g.school.name,
                  g.summary.n,
                  fmt(g.summary.mean),
                  `${fmt(g.summary.ci[0])} a ${fmt(g.summary.ci[1])}`,
                  fmt(g.summary.median, 0),
                  fmt(g.summary.sd),
                  fmt(g.summary.min, 0),
                  fmt(g.summary.max, 0),
                  `${fmt(g.summary.medianTimeMin, 0)} min`,
                ])}
              />
            }
          >
            <HBars
              rows={schoolsWithData.map((g) => ({ label: g.school.name, value: g.summary.mean, ci: g.summary.ci, note: `n=${g.summary.n}` }))}
              max={MAX_SCORE}
              format={(v) => fmt(v, 1)}
              ticks={[0, 7, 14, 21, 28]}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Distribución por colegio" subtitle="Caja: del cuartil 1 al 3; línea gruesa: mediana; bigotes: mínimo y máximo.">
              <BoxPlots groups={schoolsWithData.map((g) => ({ label: g.school.name, values: g.summary.scores }))} max={MAX_SCORE} />
            </Card>
            <Card
              title="Tamaño del efecto entre colegios (d de Cohen)"
              subtitle="Diferencia de medias en desvíos estándar: 0,2 pequeño, 0,5 mediano, 0,8 grande. Positivo = la fila supera a la columna."
            >
              {schoolsWithData.length >= 2 ? (
                <SimpleTable
                  head={["", ...schoolsWithData.map((g) => g.school.name.slice(0, 14))]}
                  rows={schoolsWithData.map((a) => [a.school.name, ...schoolsWithData.map((b) => (a === b ? "–" : fmt(cohenD(a.summary.scores, b.summary.scores), 2)))])}
                />
              ) : (
                <p className="text-sm text-slate-500">Hacen falta al menos dos colegios.</p>
              )}
            </Card>
          </div>

          <Card
            title="Acierto por colegio y dimensión"
            subtitle={`Porcentaje de respuestas correctas. Más oscuro = mayor acierto. ${DIMENSIONS.map((x) => `${x.short}: ${x.label}`).join(" · ")}.`}
          >
            <Heatmap
              rows={["Todos", ...schoolsWithData.map((g) => g.school.name)]}
              cols={DIMENSIONS.map((x) => x.key)}
              colLabels={DIMENSIONS.map((x) => x.short)}
              values={[DIMENSIONS.map((x) => s.dims[x.key]), ...schoolsWithData.map((g) => DIMENSIONS.map((x) => g.summary.dims[x.key]))]}
            />
          </Card>

          <Card title="Acierto por colegio e ítem" subtitle="Porcentaje de estudiantes que respondió bien cada ítem.">
            <Heatmap
              rows={["Todos", ...schoolsWithData.map((g) => g.school.name)]}
              cols={ITEMS.map((i) => i.id)}
              values={[ITEMS.map((i) => s.items[i.id]), ...schoolsWithData.map((g) => ITEMS.map((i) => g.summary.items[i.id]))]}
            />
          </Card>

          {d.byCourse.length > 1 && (
            <Card title="Por curso" subtitle="Media por curso (colegio · curso)." table={<SimpleTable head={["Curso", "n", "Media", "Mediana", "DE"]} rows={d.byCourse.map((c) => [c.label, c.summary.n, fmt(c.summary.mean), fmt(c.summary.median, 0), fmt(c.summary.sd)])} />}>
              <HBars rows={d.byCourse.map((c) => ({ label: c.label, value: c.summary.mean, ci: c.summary.ci, note: `n=${c.summary.n}` }))} max={MAX_SCORE} format={(v) => fmt(v, 1)} ticks={[0, 7, 14, 21, 28]} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
