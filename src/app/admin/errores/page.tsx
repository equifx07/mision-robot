import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { errorsInsight, fatigueInsight, signalsInsight, thinkingInsight } from "@/lib/insights";
import { ITEMS } from "@/lib/items";
import {
  attentionStatus,
  DIAGNOSES,
  itemPatterns,
  loadReference,
  rushedAccuracy,
  rushedByThird,
  SIGNAL_LABEL,
  studentSignals,
  THIRDS,
  type ItemPattern,
} from "@/lib/patrones";
import { FEW_DATA, RUSH_SCALE, rushTone, TONES } from "@/lib/semaforo";
import { dimensionOf, pct } from "@/lib/stats";
import { ToneHeatmap } from "@/components/admin/charts";
import { CountStackRows, ErrorLineChart, OutcomeBar, OutcomeLegend, RushCurve } from "@/components/admin/charts-misiones";
import { C, Card, Chip, EmptyState, ExplainedSection, Kpi, Notice, PageHeader, ScaleLegend, SectionIndex } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const signed = (x: number) => (Number.isFinite(x) ? `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x * 100))}` : "–");
const GRID = "grid grid-cols-[64px_minmax(140px,1fr)_minmax(220px,1.4fr)_64px_56px_60px_76px_186px] items-center gap-3";

function PatternRow({ p }: { p: ItemPattern }) {
  const item = ITEMS[p.pos - 1];
  return (
    <div className={`${GRID} min-h-[48px] border-b py-1.5 text-sm`} style={{ borderColor: "#F0EDE6" }}>
      <span className="flex flex-col leading-tight">
        <span className="font-bold">{p.id}</span>
        <span className="text-xs" style={{ color: C.muted }}>
          n.º {p.pos}
        </span>
      </span>
      <span className="leading-tight">{dimensionOf(item).label}</span>
      <OutcomeBar p={p} />
      <span className="font-bold tabular-nums">{pct(p.err)}</span>
      <span className="tabular-nums" style={{ color: C.secondary }}>
        {pct(p.expected)}
      </span>
      <span className="tabular-nums font-semibold" title="Puntos de error por encima (+) o por debajo (−) de la línea esperada" style={{ color: p.jump >= 0.15 ? TONES.bajo.ink : C.secondary }}>
        {signed(p.jump)}
      </span>
      <span className="tabular-nums" style={{ color: p.rushedShare >= 0.1 ? TONES.regular.ink : C.secondary, fontWeight: p.rushedShare >= 0.1 ? 700 : 400 }}>
        {pct(p.rushedShare)}
      </span>
      <span>
        <Chip tone={p.diagnosis.tone}>{p.diagnosis.label}</Chip>
      </span>
    </div>
  );
}

export default async function ErrorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const n = d.scored.length;
  const ref = loadReference();
  const patterns = itemPatterns(d.scored, ref);
  const byErr = [...patterns].filter((p) => Number.isFinite(p.err)).sort((a, b) => b.err - a.err);
  const top = byErr.slice(0, 10);
  const rest = byErr.slice(10);
  const hard = patterns.filter((p) => p.diagnosis.key === "dificil");
  const rush = patterns.filter((p) => p.diagnosis.key === "apuro");
  const acc = rushedAccuracy(d.scored, ref);
  const groups = [...d.bySchool].sort((a, b) => a.school.name.localeCompare(b.school.name));
  const many = groups.length > 1;
  const thirds = rushedByThird(d.scored, ref);
  const schoolThirds = groups.map((g) => ({ name: g.school.name, n: g.scored.length, t: rushedByThird(g.scored, ref) }));

  const signals = d.scored.map((r) => studentSignals(r, ref));
  const countSignals = (rows: typeof signals) => ({ n: rows.length, none: rows.filter((s) => s.signals.length === 0).length, one: rows.filter((s) => s.signals.length === 1).length, many: rows.filter((s) => s.signals.length >= 2).length });
  const total = countSignals(signals);
  const bySchoolSignals = groups.map((g) => ({ name: g.school.name, ...countSignals(signals.filter((s) => s.scored.attempt.school_id === g.school.id)) }));
  const flagged = signals.filter((s) => s.signals.length >= 2).sort((a, b) => b.signals.length - a.signals.length || b.rushed - a.rushed);
  const single = signals.filter((s) => s.signals.length === 1).sort((a, b) => b.rushed - a.rushed);
  const stackParts = (c: ReturnType<typeof countSignals>) => [
    { count: c.none, tone: attentionStatus(0).tone, label: "Sin señales" },
    { count: c.one, tone: attentionStatus(1).tone, label: "Una señal" },
    { count: c.many, tone: attentionStatus(2).tone, label: "Varias señales" },
  ];
  const most = byErr[0];

  const studentRow = (s: (typeof signals)[number]) => {
    const a = s.scored.attempt;
    const st = attentionStatus(s.signals.length);
    return (
      <div key={a.id} className="grid grid-cols-[minmax(150px,1.2fr)_minmax(140px,1fr)_70px_minmax(200px,2fr)] items-center gap-3 border-b py-2 text-sm" style={{ borderColor: "#F0EDE6" }}>
        <Link href={`/admin/estudiantes/${a.id}`} className="font-semibold text-[#22211F] underline decoration-[#C9C3B6] underline-offset-2 hover:decoration-[#22211F]">
          {a.student_name}
        </Link>
        <span style={{ color: C.secondary }}>
          {a.school_name} · {a.course_name}
        </span>
        <span className="tabular-nums">{s.scored.total}/28</span>
        <span className="flex flex-wrap gap-1.5">
          <Chip tone={st.tone}>{st.label}</Chip>
          {s.signals.map((k) => (
            <span key={k} className="rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ borderColor: C.line, color: C.secondary }}>
              {SIGNAL_LABEL[k]}
              {k === "apuro" ? ` (${s.rushed})` : ""}
            </span>
          ))}
        </span>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Errores y atención"
        subtitle="En qué misiones se equivocan más y por qué: si la misión es más difícil de lo que le toca por su lugar en la prueba, o si los chicos llegan apurados o cansados."
      />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/errores" />

      {n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Donde más se equivocan" value={most?.id ?? "–"} chip={most ? { tone: most.diagnosis.tone, label: most.diagnosis.label } : undefined} sub={most ? `Se equivocó el ${pct(most.err)} de los que la respondieron.` : undefined} />
            <Kpi
              label="Más difíciles que la línea"
              value={hard.length}
              unit={hard.length === 1 ? "misión" : "misiones"}
              chip={hard.length ? { tone: "bajo", label: "Revisar" } : { tone: "bien", label: "Ninguna" }}
              sub={hard.length ? hard.map((p) => p.id).join(", ") : "Todas tienen los errores esperados para su lugar."}
            />
            <Kpi
              label="Errores por apuro"
              value={rush.length}
              unit={rush.length === 1 ? "misión" : "misiones"}
              chip={rush.length ? { tone: "regular", label: "Atención" } : { tone: "bien", label: "Ninguna" }}
              sub={rush.length ? rush.map((p) => p.id).join(", ") : "En ninguna el apuro explica los errores."}
            />
            <Kpi
              label="Respuestas apuradas"
              value={acc.answered ? pct(acc.rushed / acc.answered) : "–"}
              chip={{ tone: rushTone(acc.answered ? acc.rushed / acc.answered : NaN), label: `${acc.rushed} de ${acc.answered}` }}
              sub={acc.rushed >= 5 ? `Acertaron ${pct(acc.right / acc.rushed)}; al azar sería 25%.` : "Casi no hubo respuestas apuradas."}
            />
            <Kpi
              label="Chicos con varias señales"
              value={total.many}
              unit={`de ${total.n}`}
              chip={total.many ? { tone: "bajo", label: "Posible desatención" } : { tone: "bien", label: "Ninguno" }}
              sub="Su puntaje puede ser menor que lo que saben."
            />
          </div>
          {n < FEW_DATA && <Notice>Con {n} chicos, los diagnósticos son orientativos: con pocos datos, una misión puede salirse de la línea por casualidad.</Notice>}

          <SectionIndex
            items={[
              { id: "donde", label: "Dónde se equivocan" },
              { id: "por-que", label: "Pensando o apurados" },
              { id: "cansancio", label: "Cansancio al final" },
              { id: "chicos", label: "Chicos con señales" },
            ]}
          />

          <ExplainedSection
            id="donde"
            kicker="1 · DÓNDE SE EQUIVOCAN"
            question="¿En qué misiones se equivocan más?"
            wide
            muestra="Cada barra es una misión, en el orden en que la hacen los chicos; la altura es el porcentaje que se equivocó. La línea punteada es lo esperado para su lugar en la prueba. El color dice por qué se equivocan."
            medicion="Errores: respuestas incorrectas sobre los chicos que la respondieron. Línea esperada: el promedio de errores de hasta 2 misiones antes y 2 después, de la misma parte. Una misión no sigue la línea si tiene al menos 15 puntos más de errores que sus vecinas y la diferencia no es casualidad. Si el salto sigue entre las respuestas con tiempo normal, es dificultad. Si desaparece al sacar las apuradas, o si 3 de cada 10 errores o más son respuestas apuradas, es apuro."
            observa={errorsInsight(patterns, n)}
          >
            <Card>
              <ErrorLineChart patterns={patterns} />
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="por-que"
            kicker="2 · PENSANDO O APURADOS"
            question="¿Se equivocan pensando o contestan apurados?"
            wide
            muestra="Las misiones ordenadas de más a menos errores. La barra reparte a todos los chicos: los que acertaron, los que se equivocaron con tiempo normal, los que contestaron apurados y los que no llegaron. Salto: cuántos puntos de error tiene por encima (+) o por debajo (−) de la línea."
            medicion="Respuesta apurada: el chico tardó menos de la décima parte de lo que tarda el chico típico en esa misión (nunca menos de 3 s ni más de 10 s); en ese tiempo no alcanza a leerla. El tiempo típico es la mediana de todas las pruebas, así el umbral es el mismo para todos los colegios."
            observa={thinkingInsight(patterns)}
          >
            <div className="overflow-x-auto rounded-[20px] border bg-white px-5 pb-3 pt-2" style={{ borderColor: C.line }}>
              <div className="min-w-[1020px]">
                <div className={`${GRID} h-11 border-b-2 text-xs font-bold tracking-[0.06em]`} style={{ borderColor: C.line, color: C.muted }}>
                  <span>MISIÓN</span>
                  <span>QUÉ EVALÚA</span>
                  <span>CÓMO RESPONDIERON</span>
                  <span>ERRORES</span>
                  <span>LÍNEA</span>
                  <span>SALTO</span>
                  <span>APURADAS</span>
                  <span>POR QUÉ SE EQUIVOCAN</span>
                </div>
                {top.map((p) => (
                  <PatternRow key={p.id} p={p} />
                ))}
                {rest.length > 0 && (
                  <details className="group">
                    <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-bold underline underline-offset-2">Ver las otras {rest.length} misiones</summary>
                    {rest.map((p) => (
                      <PatternRow key={p.id} p={p} />
                    ))}
                  </details>
                )}
              </div>
            </div>
            <OutcomeLegend />
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {(["dificil", "apuro", "linea", "facil"] as const).map((k) => (
                <div key={k} className="flex items-start gap-2.5 text-[13px] leading-snug" style={{ color: C.secondary }}>
                  <Chip tone={DIAGNOSES[k].tone}>{DIAGNOSES[k].label}</Chip>
                  <span>{DIAGNOSES[k].meaning}</span>
                </div>
              ))}
            </div>
          </ExplainedSection>

          <ExplainedSection
            id="cansancio"
            kicker="3 · CANSANCIO AL FINAL"
            question="¿Llegan cansados o apurados a las últimas misiones?"
            wide
            muestra="Arriba, misión por misión, cuántos de cada 100 chicos contestaron apurados y cuántos no llegaron porque se terminó el tiempo. Abajo, el porcentaje de respuestas apuradas al principio, en el medio y al final de la prueba, en total y por colegio."
            medicion="Si el apuro crece hacia el final, hay chicos que llegan cansados o desatentos a las últimas misiones. Para confirmar que son respuestas al azar se mira cuántas acertaron: con 4 opciones, al azar se acierta 1 de cada 4 (25%)."
            observa={fatigueInsight(
              thirds,
              acc,
              schoolThirds.map((s) => ({ name: s.name, final: s.t[2].share })),
            )}
          >
            <Card className="flex flex-col gap-7">
              <RushCurve patterns={patterns} />
              <div className="flex flex-col gap-3">
                <span className="text-[15px] font-bold">Respuestas apuradas en cada parte de la prueba</span>
                <ToneHeatmap
                  labelWidth={170}
                  columns={THIRDS.map((t) => `${t.label} (${t.range})`)}
                  groups={[
                    {
                      rows: [
                        { label: "Todos", sub: `${n} chicos`, values: thirds.map((t) => t.share) },
                        ...(many ? schoolThirds.map((s) => ({ label: s.name, sub: `${s.n} chicos`, values: s.t.map((t) => t.share) })) : []),
                      ],
                    },
                  ]}
                  cell={(v) => {
                    const t = TONES[rushTone(v)];
                    return { fill: t.fill, text: t.text, label: t.label, value: pct(v) };
                  }}
                />
                <ScaleLegend title="Colores de «Respuestas apuradas» (menos es mejor)" items={RUSH_SCALE.map((x) => ({ fill: TONES[x.tone].fill, label: TONES[x.tone].label, range: x.range }))} />
              </div>
            </Card>
          </ExplainedSection>

          <ExplainedSection
            id="chicos"
            kicker="4 · CHICOS CON SEÑALES"
            question="¿Qué chicos muestran señales de desatención?"
            wide
            muestra="Cuántos chicos no muestran señales, cuántos muestran una y cuántos varias, en total y por colegio. Debajo, los que muestran varias, con un enlace a su prueba."
            medicion="Se miran 3 señales en cada chico. Respuestas apuradas: 3 o más. Rinde menos al final: comparado con el resto en las mismas misiones, en las últimas 9 le va al menos 40 puntos peor que en las primeras 9. Se apuró al final: en las últimas 9 va el doble de rápido que en las primeras 9, comparado con el tiempo típico de cada misión. Una sola señal puede ser casualidad; varias juntas sugieren falta de atención."
            observa={signalsInsight(bySchoolSignals, total)}
          >
            <Card className="flex flex-col gap-6">
              <CountStackRows
                rows={[{ label: "Todos", n: total.n, parts: stackParts(total) }, ...(many ? bySchoolSignals.map((s) => ({ label: s.name, n: s.n, parts: stackParts(s) })) : [])]}
                legend={[0, 1, 2].map((k) => attentionStatus(k))}
              />
              <div className="flex flex-col">
                <span className="pb-1 text-[15px] font-bold">Chicos con varias señales</span>
                {flagged.length ? flagged.map(studentRow) : <span className="text-sm" style={{ color: C.secondary }}>Ninguno.</span>}
                {single.length > 0 && (
                  <details className="pt-2">
                    <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-bold underline underline-offset-2">Ver los {single.length} con una sola señal</summary>
                    {single.map(studentRow)}
                  </details>
                )}
              </div>
            </Card>
          </ExplainedSection>
        </>
      )}
    </>
  );
}
