import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { highlights, levelsInsight } from "@/lib/insights";
import { alphaTone, FEW_DATA, LEVEL_TONE, TONES } from "@/lib/semaforo";
import { fmt, LEVELS, levelOfMean, MAX_SCORE, pct } from "@/lib/stats";
import { LevelLegend, LevelStack, ScoreHistogram } from "@/components/admin/charts";
import { C, Card, Chip, EmptyState, ExplainedSection, HEADING, Kpi, PageHeader } from "@/components/admin/ui";
import { FiltersBar } from "./Filters";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const s = d.summary;
  const schools = d.bySchool.length;
  const common = [...LEVELS].sort((a, b) => s.levels[b.key] - s.levels[a.key])[0];
  const meanLevel = levelOfMean(s.mean);
  const alpha = alphaTone(d.alpha);

  return (
    <>
      <PageHeader title="Resumen" subtitle="Cómo les fue a los chicos en la prueba, en pocas cifras. El detalle está en cada sección." />
      <FiltersBar filters={filters} schools={d.schools} action="/admin" />

      {s.n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi
              label="Chicos evaluados"
              value={s.n}
              chip={s.n < FEW_DATA ? { tone: "intermedio", label: "Pocos datos" } : { tone: "neutro", label: "Dato de contexto" }}
              sub={`${schools} ${schools === 1 ? "colegio" : "colegios"}.${s.n < FEW_DATA ? " Con menos de 30 chicos, las cifras son orientativas." : ""}`}
            />
            <Kpi
              label="Puntaje promedio"
              value={fmt(s.mean)}
              unit={`de ${MAX_SCORE}`}
              chip={{ tone: LEVEL_TONE[meanLevel.key], label: `Nivel ${meanLevel.name}` }}
              sub={`Rango probable: ${fmt(s.ci[0])} a ${fmt(s.ci[1])}. Mediana ${fmt(s.median)} · desvío ${fmt(s.sd)}.`}
            />
            <Kpi
              label="Nivel más común"
              value={<span className="text-[28px] leading-tight">{common.name}</span>}
              chip={{ tone: LEVEL_TONE[common.key], label: TONES[LEVEL_TONE[common.key]].label }}
              sub={`${s.levels[common.key]} de ${s.n} chicos (${pct(s.levels[common.key] / s.n)}).`}
            />
            <Kpi label="Confiabilidad de la prueba" value={fmt(d.alpha, 2)} chip={{ tone: alpha.tone, label: alpha.label }} sub={`Alfa de Cronbach. Desde 0,80 es buena. Parte A sola: ${fmt(d.alphaA, 2)}.`} />
            <Kpi label="Tiempo típico" value={fmt(s.medianTimeMin, 0)} unit="min" chip={{ tone: "neutro", label: "Dato de contexto" }} sub="Mediana, de 45 minutos disponibles." />
          </div>

          <ExplainedSection
            id="niveles"
            kicker="1 · NIVELES DE DESEMPEÑO"
            question="¿Cómo les fue en general?"
            muestra="Arriba, cuántos chicos quedaron en cada nivel. Abajo, el puntaje de cada uno: cada barra es la cantidad de chicos que sacó ese puntaje, pintada según su nivel."
            medicion="Un punto por cada misión bien resuelta: 28 en total (20 del robot y 8 de lógica). Los niveles son cortes provisorios sobre ese puntaje (Inicial 0–9, En desarrollo 10–16, Logrado 17–22, Avanzado 23–28) y se van a recalibrar después del piloto."
            observa={levelsInsight(s, d.bySchool)}
          >
            <Card className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <span className="text-[15px] font-bold">Chicos por nivel</span>
                <LevelStack levels={s.levels} n={s.n} />
                <LevelLegend />
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-[15px] font-bold">Puntaje de cada chico</span>
                <ScoreHistogram scores={s.scores} max={MAX_SCORE} />
              </div>
            </Card>
          </ExplainedSection>

          <section aria-labelledby="importante" className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold tracking-[0.08em]" style={{ color: C.muted }}>
                2 · PARA MIRAR PRIMERO
              </span>
              <h2 id="importante" className={`${HEADING} m-0 text-[27px] font-semibold`}>
                Lo más importante de cada sección
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {highlights(s, d.bySchool, d.items).map((h) => (
                <div key={h.href} className="flex flex-col gap-2.5 rounded-[18px] border bg-white p-5" style={{ borderColor: C.line }}>
                  <span>
                    <Chip tone={h.tone}>{h.badge}</Chip>
                  </span>
                  <p className="m-0 text-[17px] font-semibold leading-snug">{h.text}</p>
                  <Link href={h.href} className="mt-auto text-[15px] font-bold text-[#22211F] underline-offset-2 hover:underline">
                    {h.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
