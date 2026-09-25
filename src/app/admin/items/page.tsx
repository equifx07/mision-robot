import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { ITEMS } from "@/lib/items";
import { dimensionOf, fmt, pct, TASK_LABEL } from "@/lib/stats";
import { Card, HBars } from "@/components/charts/Charts";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const FLAG: Record<string, { text: string; cls: string }> = {
  ok: { text: "OK", cls: "bg-green-100 text-green-800" },
  facil: { text: "Muy fácil (p > 0,90)", cls: "bg-amber-100 text-amber-800" },
  dificil: { text: "Muy difícil (p < 0,25)", cls: "bg-amber-100 text-amber-800" },
  "baja-disc": { text: "Discrimina poco (< 0,20)", cls: "bg-orange-100 text-orange-800" },
  negativa: { text: "Discriminación negativa: revisar", cls: "bg-red-100 text-red-800" },
};

export default async function ItemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const d = loadDashboard(filters);
  const n = d.scored.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Análisis de ítems</h1>
        <p className="text-sm text-slate-500">
          Dificultad (p): proporción de aciertos. Discriminación: correlación punto-biserial entre el ítem y el resto de la prueba (ideal ≥ 0,30). Alfa de Cronbach global: <strong>{fmt(d.alpha, 2)}</strong> (Parte A: {fmt(d.alphaA, 2)}), con {n} estudiante{n === 1 ? "" : "s"}. Los indicadores se vuelven confiables a partir de unos 30 estudiantes.
        </p>
      </div>
      <FiltersBar filters={filters} schools={d.schools} action="/admin/items" />

      {n === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-black/10">Todavía no hay pruebas terminadas con estos filtros.</p>
      ) : (
        <>
          <Card title="Dificultad por ítem" subtitle="Proporción de estudiantes que respondió bien. Ordenados como en la prueba.">
            <HBars rows={d.items.map((it) => ({ label: it.id, value: it.p }))} max={1} width={620} />
          </Card>
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/10">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {["Ítem", "Dimensión", "Tarea", "p", "Discrim.", "Opciones elegidas (a · b · c · d)", "Sin resp.", "Tiempo mediano", "Estado"].map((h) => (
                    <th key={h} className="px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.items.map((st) => {
                  const item = ITEMS.find((i) => i.id === st.id)!;
                  const f = FLAG[st.flag];
                  return (
                    <tr key={st.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs font-semibold">{st.id}</td>
                      <td className="px-3 py-2">{dimensionOf(item).label}</td>
                      <td className="px-3 py-2">{item.part === "A" ? TASK_LABEL[item.task] : "–"}</td>
                      <td className="px-3 py-2 tabular-nums">{fmt(st.p, 2)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmt(st.rpb, 2)}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {st.choices.map((c, i) => (
                          <span key={i} className={`mr-2 ${i === item.correct ? "font-bold text-green-800" : "text-slate-600"}`}>
                            {"abcd"[i]} {c}
                            {i === item.correct ? " ✓" : ""}
                          </span>
                        ))}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{st.omitted}</td>
                      <td className="px-3 py-2 tabular-nums">{Number.isFinite(st.medianTimeS) ? `${fmt(st.medianTimeS, 0)} s` : "–"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${f.cls}`}>{f.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            Las opciones se cuentan en el orden canónico del banco (a es siempre la correcta en el banco; los chicos las ven mezcladas). Un distractor que nadie elige no aporta; uno que eligen más que la correcta con discriminación negativa sugiere un ítem ambiguo. Acierto global esperado tras el piloto: {pct(0.6)} aproximado.
          </p>
        </>
      )}
    </div>
  );
}
