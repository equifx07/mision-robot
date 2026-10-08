import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { dimsInsight, itemsBySchoolInsight, TASK_NAME, tasksInsight } from "@/lib/insights";
import { PCT_RANGES, SCALE, TONES } from "@/lib/semaforo";
import { dimensionOf, dimensionsOf } from "@/lib/stats";
import { ToneHeatmap, type HeatRow } from "@/components/admin/charts";
import { Card, EmptyState, ExplainedSection, PageHeader, ScaleLegend, SectionIndex } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const range = (ids: string[]) => (ids.length === 1 ? `Misión ${ids[0]}` : ids.length === 2 ? `${ids[0]} y ${ids[1]}` : `${ids[0]} a ${ids[ids.length - 1]}`);

export default async function ConceptsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const s = d.summary;
  const groups = [...d.bySchool].sort((a, b) => b.summary.mean - a.summary.mean);
  const many = groups.length > 1;
  const columns = ["Todos", ...(many ? groups.map((g) => g.school.name) : [])];
  const cols = (get: (sum: typeof s) => number) => [get(s), ...(many ? groups.map((g) => get(g.summary)) : [])];

  const dimRows = (group: "concepto" | "practica"): HeatRow[] =>
    dimensionsOf(d.test).filter((x) => x.group === group).map((x) => ({ label: x.label, sub: range(x.items), values: cols((sum) => sum.dims[x.key]) }));
  const perTask: Record<string, number> = { S: 0, C: 0, D: 0, E: 0 };
  for (const it of d.test.items) if (it.part === "A") perTask[it.task]++;
  const taskRows: HeatRow[] = (["S", "C", "D", "E"] as const).filter((t) => perTask[t] > 0).map((t) => ({ label: TASK_NAME[t], sub: `${perTask[t]} ${perTask[t] === 1 ? "misión" : "misiones"}`, values: cols((sum) => sum.tasks[t]) }));
  const itemRows = (part: "A" | "B"): HeatRow[] =>
    d.test.items.filter((it) => it.part === part).map((it) => ({ label: it.id, sub: dimensionOf(it).label, values: cols((sum) => sum.items[it.id]) }));
  const legend = SCALE.map((t) => ({ fill: TONES[t].fill, label: TONES[t].label, range: PCT_RANGES[t as keyof typeof PCT_RANGES] }));

  return (
    <>
      <PageHeader title="Conceptos y prácticas" subtitle="Qué partes del pensamiento computacional dominan los chicos y cuáles les cuestan, en total y en cada colegio." />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/conceptos" />

      {s.n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <>
          <SectionIndex
            items={[
              { id: "conceptos", label: "Qué saben hacer" },
              { id: "tareas", label: "Tipo de tarea" },
              { id: "misiones", label: "Misión por misión" },
            ]}
          />

          <ExplainedSection
            id="conceptos"
            kicker="1 · QUÉ SABEN HACER"
            question="¿Qué conceptos dominan y cuáles les cuestan?"
            muestra="El porcentaje de respuestas correctas en cada concepto de programación (Parte A, el robot) y en cada práctica de lógica (Parte B). La primera columna es el total; las otras, cada colegio."
            medicion="Cada concepto y cada práctica tiene una o más misiones (debajo de cada nombre se ve cuáles). Se juntan todas las respuestas de los chicos a esas misiones y se calcula qué porcentaje fue correcto. Donde hay una sola misión, el número cambia mucho con pocos chicos."
            observa={dimsInsight(d.test, s, groups)}
          >
            <Card className="flex flex-col gap-5">
              <ToneHeatmap
                columns={columns}
                groups={[
                  { title: "PARTE A · PROGRAMAR AL ROBOT (CONCEPTOS)", rows: dimRows("concepto") },
                  { title: "PARTE B · DESAFÍOS DE LÓGICA (PRÁCTICAS)", rows: dimRows("practica") },
                ]}
              />
              <ScaleLegend items={legend} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="tareas"
            kicker="2 · TIPO DE TAREA"
            question="¿Qué tipo de tarea les cuesta más?"
            muestra="El porcentaje de acierto según lo que había que hacer en la misión del robot: elegir el programa, completar un hueco o arreglar un error."
            medicion={`Cada misión de la Parte A tiene un tipo de tarea: ${perTask.S} de elegir, ${perTask.C} de completar y ${perTask.D} de arreglar${perTask.E ? `, y ${perTask.E} de comparar` : ""}. Se calcula el porcentaje de respuestas correctas en cada grupo.`}
            observa={tasksInsight(s, perTask)}
          >
            <Card className="flex flex-col gap-5">
              <ToneHeatmap columns={columns} groups={[{ rows: taskRows }]} />
              <ScaleLegend items={legend} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="misiones"
            kicker="3 · MISIÓN POR MISIÓN"
            question="¿Cómo le fue a cada colegio en cada misión?"
            muestra={`El porcentaje de chicos que resolvió bien cada una de las ${d.test.max} misiones, en total y en cada colegio.`}
            medicion="Para cada misión: chicos que la respondieron bien dividido por chicos que terminaron la prueba. Con pocos chicos por colegio, un solo chico cambia mucho el porcentaje."
            observa={itemsBySchoolInsight(s, groups, d.test.ids)}
          >
            <Card className="flex flex-col gap-5">
              <ToneHeatmap
                labelWidth={200}
                columns={columns}
                groups={[
                  { title: "PARTE A · PROGRAMAR AL ROBOT", rows: itemRows("A") },
                  { title: "PARTE B · DESAFÍOS DE LÓGICA", rows: itemRows("B") },
                ]}
              />
              <ScaleLegend items={legend} />
            </Card>
          </ExplainedSection>
        </>
      )}
    </>
  );
}
