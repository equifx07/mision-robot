import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { cohenInsight, levelsBySchoolInsight, meansInsight, spreadInsight } from "@/lib/insights";
import { D_SCALE } from "@/lib/semaforo";
import { levelsText } from "@/lib/tests";
import { CohenMatrix, LevelStackRows, MeanBars, SpreadBoxes } from "@/components/admin/charts";
import { Card, EmptyState, ExplainedSection, Notice, PageHeader, ScaleLegend, SectionIndex } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

export default async function ComparisonPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const s = d.summary;
  const groups = [...d.bySchool].sort((a, b) => b.summary.mean - a.summary.mean);
  const many = groups.length > 1;
  const chicos = (n: number) => `${n} ${n === 1 ? "chico" : "chicos"}`;

  const sections = [
    { id: "promedio", label: "Promedio" },
    { id: "niveles", label: "Niveles" },
    { id: "parejos", label: "Qué tan parejos" },
    ...(many ? [{ id: "diferencias", label: "Tamaño de las diferencias" }] : []),
  ];
  let k = 0;
  const kicker = (t: string) => `${++k} · ${t}`;

  return (
    <>
      <PageHeader title="Comparación entre colegios" subtitle={`Se comparan solo chicos del mismo grado: todos hicieron las mismas ${d.test.max} misiones de la prueba de ${d.test.label}. Con pocos chicos por colegio, las diferencias chicas todavía no son confiables.`} />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/comparacion" />

      {s.n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <>
          <SectionIndex items={sections} />
          {!many && <Notice>Con los filtros actuales hay datos de un solo colegio. Sacá el filtro de colegio para comparar.</Notice>}

          <ExplainedSection
            id="promedio"
            kicker={kicker("PROMEDIO")}
            question="¿Qué colegio tuvo mejor puntaje promedio?"
            muestra={`La barra es el puntaje promedio de cada colegio, de 0 a ${d.test.max}, pintada según el nivel en el que cae. La línea fina es el rango donde probablemente está el promedio real.`}
            medicion="Promedio del puntaje total de los chicos que terminaron la prueba. El rango es el intervalo de confianza del 95%: con otros chicos del mismo colegio, el promedio caería ahí 95 de cada 100 veces. Con pocos chicos, el rango se ensancha."
            observa={meansInsight(d.test, groups)}
          >
            <Card>
              <MeanBars
                test={d.test}
                rows={[
                  { label: "Todos", sub: chicos(s.n), mean: s.mean, ci: s.ci, separate: many },
                  ...(many ? groups.map((g) => ({ label: g.school.name, sub: chicos(g.summary.n), mean: g.summary.mean, ci: g.summary.ci })) : []),
                ]}
              />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="niveles"
            kicker={kicker("NIVELES")}
            question="¿Cómo se reparten sus chicos en los niveles?"
            muestra="Cada barra es un colegio y suma todos sus chicos. Cada color es un nivel; el número de adentro es cuántos chicos hay en ese nivel."
            medicion={`Cada chico se ubica en un nivel según su puntaje total: ${levelsText(d.test)}.`}
            observa={levelsBySchoolInsight(groups)}
          >
            <Card>
              <LevelStackRows
                test={d.test}
                rows={[{ label: "Todos", n: s.n, levels: s.levels }, ...(many ? groups.map((g) => ({ label: g.school.name, n: g.summary.n, levels: g.summary.levels })) : [])]}
              />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="parejos"
            kicker={kicker("QUÉ TAN PAREJOS")}
            question="¿Los chicos de cada colegio rinden parecido entre sí?"
            muestra="Cómo se reparten los puntajes dentro de cada colegio. La caja abarca a la mitad central de los chicos; cuanto más angosta, más parejo es el grupo."
            medicion="Se ordenan los puntajes de cada colegio. La caja va del primer cuartil (el 25% de abajo) al tercero (el 25% de arriba); la raya gruesa es la mediana y la línea fina va del puntaje más bajo al más alto. La caja se pinta según el nivel de la mediana."
            observa={spreadInsight(groups)}
          >
            <Card>
              <SpreadBoxes test={d.test} rows={many ? groups.map((g) => ({ label: g.school.name, s: g.summary })) : [{ label: groups[0]?.school.name ?? "Todos", s }]} />
            </Card>
          </ExplainedSection>

          {many && (
            <ExplainedSection
              id="diferencias"
              kicker={kicker("TAMAÑO DE LAS DIFERENCIAS")}
              question="¿Las diferencias entre colegios son grandes?"
              muestra="Cuánto rinde el colegio de la fila comparado con el de la columna. Verde: la fila rinde más. Rojo: rinde menos. Gris: son parecidos."
              medicion="Con la d de Cohen: la diferencia entre los dos promedios dividida por cuánto varían los puntajes dentro de los colegios. Sirve para comparar colegios de distinto tamaño. Referencia habitual: 0,2 pequeña, 0,5 mediana, 0,8 grande."
              observa={cohenInsight(groups)}
            >
              <Card className="flex flex-col gap-5">
                <CohenMatrix groups={groups.map((g) => ({ name: g.school.name, scores: g.summary.scores }))} />
                <ScaleLegend items={D_SCALE} />
              </Card>
            </ExplainedSection>
          )}

        </>
      )}
    </>
  );
}
