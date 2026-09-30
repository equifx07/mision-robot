import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { itemsQualityInsight, TASK_NAME } from "@/lib/insights";
import { ITEMS } from "@/lib/items";
import { DISC_SCALE, discTone, FEW_DATA, itemStatus, PCT_RANGES, pctTone, SCALE, TONES, type Tone } from "@/lib/semaforo";
import { dimensionOf, fmt, pct } from "@/lib/stats";
import { C, Chip, EmptyState, ExplainedSection, PageHeader, ScaleLegend } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

export default async function ItemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const n = d.scored.length;
  const rows = d.items.map((st) => ({ st, item: ITEMS.find((i) => i.id === st.id)!, status: itemStatus(st.p, st.rpb) }));
  const count = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).length;
  const summary: { tone: Tone; text: string }[] = [
    { tone: "bien" as Tone, text: `${count((r) => r.status.label === "Funciona bien")} funcionan bien` },
    { tone: "intermedio" as Tone, text: `${count((r) => r.status.tone === "intermedio")} aceptables o muy difíciles` },
    { tone: "bajo" as Tone, text: `${count((r) => r.status.tone === "bajo" || r.status.tone === "critico")} para revisar` },
    { tone: "neutro" as Tone, text: `${count((r) => r.status.tone === "neutro")} muy fáciles o sin datos` },
  ].filter((x) => !x.text.startsWith("0 "));
  const grid = "grid grid-cols-[56px_minmax(0,1fr)_90px_180px_88px_176px_52px_196px] items-center gap-3";

  return (
    <>
      <PageHeader title="Calidad de las misiones" subtitle="Esta página revisa la prueba, no a los chicos: muestra si cada misión funcionó como se esperaba. Sirve para decidir qué ajustar después del piloto." />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/items" />

      {n === 0 ? (
        <EmptyState>Todavía no hay pruebas terminadas con estos filtros.</EmptyState>
      ) : (
        <ExplainedSection
          id="misiones"
          kicker="1 · MISIÓN POR MISIÓN"
          question="¿Cada misión funcionó bien?"
          wide
          muestra="Una fila por misión. Acierto: qué porcentaje de chicos la resolvió bien. Separa: si la misión distingue a los chicos que rinden más de los que rinden menos. También qué opción eligieron y cuánto tardaron."
          medicion={`Acierto: respuestas correctas sobre chicos que la respondieron. Separa: correlación punto-biserial entre acertar la misión y el puntaje en el resto de la prueba; desde 0,30 es buena y debajo de 0,20 la misión casi no ayuda a medir. Confiabilidad de toda la prueba (alfa de Cronbach): ${fmt(d.alpha, 2)}.`}
          observa={itemsQualityInsight(d.items, n)}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            {summary.map((x) => (
              <Chip key={x.text} tone={x.tone} className="!px-3 !py-1.5 !text-sm">
                {x.text}
              </Chip>
            ))}
            {n < FEW_DATA && (
              <span className="text-[13px]" style={{ color: C.muted }}>
                Con {n} {n === 1 ? "chico" : "chicos"}, estos valores son orientativos.
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-[20px] border bg-white px-5 pb-3 pt-2" style={{ borderColor: C.line }}>
            <div className="min-w-[1000px]">
              <div className={`${grid} h-11 border-b-2 text-xs font-bold tracking-[0.06em]`} style={{ borderColor: C.line, color: C.muted }}>
                <span>MISIÓN</span>
                <span>QUÉ EVALÚA</span>
                <span>TAREA</span>
                <span>ACIERTO</span>
                <span>SEPARA</span>
                <span>OPCIONES ELEGIDAS</span>
                <span>TIEMPO</span>
                <span>ESTADO</span>
              </div>
              {rows.map(({ st, item, status }) => {
                const pt = TONES[pctTone(st.p)];
                const dt = TONES[discTone(st.rpb)];
                return (
                  <div key={st.id} className={`${grid} min-h-[44px] border-b py-1.5 text-sm`} style={{ borderColor: "#F0EDE6" }}>
                    <span className="font-bold">{st.id}</span>
                    <span className="leading-tight">{dimensionOf(item).label}</span>
                    <span style={{ color: C.secondary }}>{item.part === "A" ? TASK_NAME[item.task].split(" ")[0] : "—"}</span>
                    <div className="flex items-center gap-2.5" title={`${st.id}: ${pct(st.p)} de acierto`}>
                      <div className="h-3 w-[120px] overflow-hidden rounded-md" style={{ background: C.soft }}>
                        <div className="h-3 rounded-md" style={{ width: `${Number.isFinite(st.p) ? st.p * 100 : 0}%`, background: pt.fill }} />
                      </div>
                      <span className="font-bold">{pct(st.p)}</span>
                    </div>
                    <span title={Number.isFinite(st.rpb) ? `Separa: ${fmt(st.rpb, 2)}` : "No se puede calcular"}>
                      <span className="rounded-full px-2.5 py-0.5 font-bold" style={{ background: dt.fill, color: dt.text }}>
                        {Number.isFinite(st.rpb) ? fmt(st.rpb, 2) : "sin dato"}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-x-2 text-[13px] tabular-nums" style={{ color: C.secondary }}>
                      {st.choices.map((c, i) => (
                        <span key={i} className={i === item.correct ? "font-bold text-[#22211F]" : ""}>
                          {"abcd"[i]} {c}
                          {i === item.correct ? "✓" : ""}
                        </span>
                      ))}
                      {st.omitted > 0 && <span>sin resp. {st.omitted}</span>}
                    </span>
                    <span style={{ color: C.secondary }}>{Number.isFinite(st.medianTimeS) ? `${fmt(st.medianTimeS, 0)} s` : "–"}</span>
                    <span>
                      <Chip tone={status.tone}>{status.label}</Chip>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ScaleLegend title="Colores de «Acierto»" items={SCALE.map((t) => ({ fill: TONES[t].fill, label: TONES[t].label, range: PCT_RANGES[t as keyof typeof PCT_RANGES] }))} />
            <ScaleLegend title="Colores de «Separa»" items={DISC_SCALE.map((x) => ({ fill: TONES[x.tone].fill, label: x.label, range: x.range }))} />
          </div>
          <p className="m-0 text-[13px]" style={{ color: C.muted }}>
            Las opciones se cuentan en el orden del banco (la a es siempre la correcta; los chicos las ven mezcladas). Un distractor que nadie elige no aporta; uno que eligen más que la correcta, con una misión que separa poco, sugiere que la consigna es ambigua.
          </p>
        </ExplainedSection>
      )}
    </>
  );
}
