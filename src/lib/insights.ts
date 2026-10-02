// "Qué se observa": conclusiones cortas, en castellano llano, calculadas con los datos que se
// están mostrando (cambian con los filtros). Cada función recibe lo mismo que su gráfico.
import type { SchoolGroup } from "./dashboard";
import { dSize, FEW_DATA, itemStatus } from "./semaforo";
import type { ItemPattern, TimeStats } from "./patrones";
import { cohenD, DIMENSIONS, fmt, type GroupSummary, type ItemStats, LEVELS, levelOfMean, median, pct } from "./stats";

export const TASK_NAME: Record<string, string> = { S: "Elegir el programa", C: "Completar un hueco", D: "Arreglar un error", E: "Comparar programas" };
const TASK_SHORT: Record<string, string> = { S: "elegir", C: "completar", D: "arreglar", E: "comparar" };

const chicos = (n: number) => `${n} ${n === 1 ? "chico" : "chicos"}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
const num = (x: number) => fmt(x, 2);

// ───────── Resumen ─────────

export function levelsInsight(s: GroupSummary, bySchool: SchoolGroup[]): string {
  if (!s.n) return "";
  const high = s.levels.logrado + s.levels.avanzado;
  const top = [...LEVELS].sort((a, b) => s.levels[b.key] - s.levels[a.key])[0];
  const parts = [`${high} de ${s.n} chicos (${pct(high / s.n)}) llegó a Logrado o Avanzado.`];
  parts.push(`El grupo más grande es ${top.name}, con ${s.levels[top.key]}.`);
  const ini = s.levels.inicial;
  if (ini > 0) {
    const from = bySchool.filter((g) => g.summary.levels.inicial > 0);
    if (bySchool.length > 1 && from.length === 1) parts.push(ini === 1 ? `El único chico en Inicial es de ${from[0].school.name}.` : `Los ${ini} chicos en Inicial son de ${from[0].school.name}.`);
    else parts.push(ini === 1 ? "1 chico quedó en Inicial." : `${ini} chicos quedaron en Inicial.`);
  } else parts.push("Ningún chico quedó en Inicial.");
  return parts.join(" ");
}

// ───────── Comparación entre colegios ─────────

export function meansInsight(groups: SchoolGroup[]): string {
  if (groups.length < 2) return groups.length ? `Hay datos de un solo colegio (${groups[0].school.name}). Sacá el filtro de colegio para comparar.` : "";
  const sorted = [...groups].sort((a, b) => b.summary.mean - a.summary.mean);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const parts = [
    `${best.school.name} tiene el promedio más alto (${fmt(best.summary.mean)}, ${levelOfMean(best.summary.mean).name}) y ${worst.school.name} el más bajo (${fmt(worst.summary.mean)}, ${levelOfMean(worst.summary.mean).name}).`,
  ];
  const overlap = best.summary.ci[0] <= worst.summary.ci[1];
  const ns = groups.map((g) => g.summary.n);
  const lo = Math.min(...ns);
  const hi = Math.max(...ns);
  const size = lo === hi ? `${lo}` : `${lo} a ${hi}`;
  parts.push(
    overlap
      ? `Los rangos se superponen: con ${size} chicos por colegio, todavía no se puede afirmar que uno rinde más que otro.`
      : `Los rangos de ${best.school.name} y ${worst.school.name} no se superponen: la diferencia entre ellos es clara.`,
  );
  return parts.join(" ");
}

export function levelsBySchoolInsight(groups: SchoolGroup[]): string {
  if (!groups.length) return "";
  const parts: string[] = [];
  const withIni = groups.filter((g) => g.summary.levels.inicial > 0);
  if (withIni.length === 0) parts.push("Ningún colegio tiene chicos en Inicial.");
  else if (withIni.length === 1 && groups.length > 1) {
    const g = withIni[0];
    const noAdv = g.summary.levels.avanzado === 0 ? " y no tiene ninguno en Avanzado" : "";
    parts.push(`${g.school.name} es el único colegio con chicos en Inicial (${g.summary.levels.inicial} de ${g.summary.n})${noAdv}.`);
  } else parts.push(`Tienen chicos en Inicial: ${list(withIni.map((g) => `${g.school.name} (${g.summary.levels.inicial} de ${g.summary.n})`))}.`);
  const share = (g: SchoolGroup) => (g.summary.levels.logrado + g.summary.levels.avanzado) / g.summary.n;
  const best = [...groups].sort((a, b) => share(b) - share(a))[0];
  parts.push(`En ${best.school.name}, ${best.summary.levels.logrado + best.summary.levels.avanzado} de ${best.summary.n} llegaron a Logrado o Avanzado.`);
  const dev = [...groups].sort((a, b) => b.summary.levels.desarrollo / b.summary.n - a.summary.levels.desarrollo / a.summary.n)[0];
  if (dev !== best && dev.summary.levels.desarrollo / dev.summary.n >= 0.5) parts.push(`En ${dev.school.name}, ${dev.summary.levels.desarrollo} de ${dev.summary.n} están En desarrollo.`);
  return parts.join(" ");
}

export function spreadInsight(groups: SchoolGroup[]): string {
  const valid = groups.filter((g) => g.summary.n >= 2);
  if (!valid.length) return "";
  const iqr = (g: SchoolGroup) => g.summary.q3 - g.summary.q1;
  const sorted = [...valid].sort((a, b) => iqr(b) - iqr(a));
  const wide = sorted[0];
  const parts = [`Los puntajes más dispares están en ${wide.school.name}: la mitad de sus chicos va de ${fmt(wide.summary.q1, 0)} a ${fmt(wide.summary.q3, 0)} puntos.`];
  if (sorted.length > 1) {
    const narrow = sorted[sorted.length - 1];
    parts.push(`En ${narrow.school.name} rinden más parejo: la mitad va de ${fmt(narrow.summary.q1, 0)} a ${fmt(narrow.summary.q3, 0)}.`);
  }
  return parts.join(" ");
}

export function cohenInsight(groups: SchoolGroup[]): string {
  if (groups.length < 2) return "";
  const pairs: { a: SchoolGroup; b: SchoolGroup; d: number }[] = [];
  for (let i = 0; i < groups.length; i++)
    for (let j = i + 1; j < groups.length; j++) {
      const d = cohenD(groups[i].summary.scores, groups[j].summary.scores);
      if (Number.isFinite(d)) pairs.push(d >= 0 ? { a: groups[i], b: groups[j], d } : { a: groups[j], b: groups[i], d: -d });
    }
  if (!pairs.length) return "Hacen falta al menos 2 chicos por colegio para calcular las diferencias.";
  pairs.sort((x, y) => y.d - x.d);
  const shown = pairs.slice(0, 3).map((p, i) => {
    const size = dSize(p.d);
    const tail = size === "pequeña" || size === "casi nula" ? ": rinden parecido" : "";
    return i === 0
      ? `La diferencia entre ${p.a.school.name} y ${p.b.school.name} es ${size} (${num(p.d)})${tail}.`
      : `Entre ${p.a.school.name} y ${p.b.school.name} es ${size} (${num(p.d)})${tail}.`;
  });
  if (pairs.length > 3) shown.push(`Las demás parejas tienen diferencias menores.`);
  return shown.join(" ");
}

export function coursesInsight(courses: { label: string; summary: GroupSummary }[]): string {
  if (courses.length < 2) return "";
  const sorted = [...courses].sort((a, b) => b.summary.mean - a.summary.mean);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return `El curso con mejor promedio es ${best.label} (${fmt(best.summary.mean)}) y el más bajo, ${worst.label} (${fmt(worst.summary.mean)}). Con pocos chicos por curso, las diferencias son orientativas.`;
}

// ───────── Conceptos y prácticas ─────────

export function dimsInsight(s: GroupSummary, groups: SchoolGroup[]): string {
  const dims = DIMENSIONS.filter((d) => Number.isFinite(s.dims[d.key]));
  if (!dims.length) return "";
  const sorted = [...dims].sort((a, b) => s.dims[b.key] - s.dims[a.key]);
  const top = sorted[0];
  const low = sorted.slice(-2).reverse();
  const parts = [
    `${top.label} es lo más logrado (${pct(s.dims[top.key])}).`,
    `Lo que más cuesta es ${low[0].label} (${pct(s.dims[low[0].key])})${low[1] ? ` y ${low[1].label} (${pct(s.dims[low[1].key])})` : ""}.`,
  ];
  if (groups.length > 1) {
    const reds = (g: SchoolGroup) => dims.filter((d) => g.summary.dims[d.key] < 0.45);
    const greens = (g: SchoolGroup) => dims.filter((d) => g.summary.dims[d.key] >= 0.75);
    const worst = [...groups].sort((a, b) => reds(b).length - reds(a).length)[0];
    const r = reds(worst);
    if (r.length) parts.push(`${worst.school.name} queda en rojo en ${r.length === 1 ? "uno" : r.length}: ${list(r.map((d) => d.label))}.`);
    const best = [...groups].sort((a, b) => greens(b).length - greens(a).length)[0];
    const gr = greens(best);
    const br = reds(best);
    if (gr.length && best !== worst) parts.push(`${best.school.name} tiene ${gr.length} en verde${br.length ? ` y ${br.length === 1 ? "uno solo" : br.length} en rojo (${list(br.map((d) => d.label))})` : " y ninguno en rojo"}.`);
  }
  return parts.join(" ");
}

export function tasksInsight(s: GroupSummary, itemsPerTask: Record<string, number>): string {
  const keys = ["S", "C", "D", "E"].filter((k) => Number.isFinite(s.tasks[k]) && itemsPerTask[k] > 1);
  if (!keys.length) return "";
  const sorted = [...keys].sort((a, b) => s.tasks[b] - s.tasks[a]);
  const easy = sorted[0];
  const hard = sorted.slice(-2).reverse();
  const parts = [`${TASK_NAME[easy]} es lo más fácil (${pct(s.tasks[easy])}).`];
  if (hard.length && hard[0] !== easy) {
    const names = hard.filter((k) => k !== easy).map((k) => `${TASK_SHORT[k]} (${pct(s.tasks[k])})`);
    const onProgram = hard.every((k) => k === "C" || k === "D");
    parts.push(`${names.length > 1 ? `${names[0][0].toUpperCase()}${names[0].slice(1)} y ${names[1]} cuestan más` : `${names[0][0].toUpperCase()}${names[0].slice(1)} cuesta más`}${onProgram ? ": trabajar sobre un programa ya hecho es más difícil que reconocer uno" : ""}.`);
  }
  const single = ["S", "C", "D", "E"].filter((k) => itemsPerTask[k] === 1);
  if (single.length) parts.push(`${list(single.map((k) => TASK_NAME[k]))} tiene una sola misión, así que su número es orientativo.`);
  return parts.join(" ");
}

export function itemsBySchoolInsight(s: GroupSummary, groups: SchoolGroup[], ids: string[]): string {
  const valid = ids.filter((id) => Number.isFinite(s.items[id]));
  if (!valid.length) return "";
  const sorted = [...valid].sort((a, b) => s.items[a] - s.items[b]);
  const hard = sorted.slice(0, 2);
  const easy = sorted[sorted.length - 1];
  const parts = [`Las misiones más difíciles fueron ${list(hard.map((id) => `${id} (${pct(s.items[id])})`))}; la más fácil, ${easy} (${pct(s.items[easy])}).`];
  if (groups.length > 1) {
    let best = { id: "", gap: 0, hi: "", lo: "" };
    for (const id of valid) {
      const vals = groups.map((g) => ({ name: g.school.name, v: g.summary.items[id] })).filter((x) => Number.isFinite(x.v));
      if (vals.length < 2) continue;
      vals.sort((a, b) => b.v - a.v);
      const gap = vals[0].v - vals[vals.length - 1].v;
      if (gap > best.gap) best = { id, gap, hi: `${vals[0].name} (${pct(vals[0].v)})`, lo: `${vals[vals.length - 1].name} (${pct(vals[vals.length - 1].v)})` };
    }
    if (best.id && best.gap >= 0.3) parts.push(`La mayor diferencia entre colegios está en ${best.id}: ${best.hi} contra ${best.lo}.`);
  }
  return parts.join(" ");
}

// ───────── Calidad de las misiones ─────────

export function itemsQualityInsight(items: ItemStats[], n: number): string {
  if (!n) return "";
  const st = items.map((it) => ({ it, s: itemStatus(it.p, it.rpb) }));
  const good = st.filter((x) => x.s.label === "Funciona bien").length;
  const ok = st.filter((x) => x.s.label === "Aceptable").length;
  const weak = st.filter((x) => x.s.tone === "bajo" || x.s.tone === "critico");
  const allRight = st.filter((x) => x.s.label === "Todos acertaron" || x.s.label === "Muy fácil");
  const parts = [`${good} de las ${items.length} misiones funcionan bien${ok ? ` y ${ok} ${ok === 1 ? "es aceptable" : "son aceptables"}` : ""}.`];
  if (weak.length)
    parts.push(
      `${list(weak.map((x) => x.it.id))} ${weak.length === 1 ? "separa" : "separan"} poco (${list(weak.map((x) => num(x.it.rpb)))}): conviene ${weak.length === 1 ? "revisarla" : "revisarlas"} después del piloto.`,
    );
  if (allRight.length) parts.push(`${list(allRight.map((x) => x.it.id))} ${allRight.length === 1 ? "la resolvieron todos: sirve de entrada, pero no diferencia" : "las resolvieron casi todos: no diferencian"}.`);
  if (n < FEW_DATA) parts.push(`Con ${chicos(n)}, estos valores son orientativos.`);
  return parts.join(" ");
}

// ───────── Lo más importante (tarjetas del resumen) ─────────

export type Highlight = { tone: "bien" | "bajo" | "intermedio" | "neutro" | "critico" | "muybien" | "regular"; badge: string; text: string; href: string; cta: string };

export function highlights(s: GroupSummary, groups: SchoolGroup[], items: ItemStats[]): Highlight[] {
  const out: Highlight[] = [];
  if (groups.length > 1) {
    const best = [...groups].sort((a, b) => b.summary.mean - a.summary.mean)[0];
    const lv = levelOfMean(best.summary.mean);
    out.push({ tone: lv.key === "avanzado" ? "muybien" : lv.key === "logrado" ? "bien" : lv.key === "desarrollo" ? "intermedio" : "bajo", badge: "Mejor promedio", text: `${best.school.name} tiene el promedio más alto: ${fmt(best.summary.mean)} de 28, nivel ${lv.name}.`, href: "/admin/comparacion", cta: "Ver comparación entre colegios" });
  } else if (groups.length === 1) {
    out.push({ tone: "neutro", badge: "Un solo colegio", text: `Con estos filtros hay datos de un solo colegio: ${groups[0].school.name}.`, href: "/admin/comparacion", cta: "Ver comparación entre colegios" });
  }
  const dims = DIMENSIONS.filter((d) => Number.isFinite(s.dims[d.key])).sort((a, b) => s.dims[a.key] - s.dims[b.key]);
  if (dims.length >= 2) {
    const v = s.dims[dims[0].key];
    out.push({ tone: v < 0.3 ? "critico" : v < 0.45 ? "bajo" : v < 0.6 ? "regular" : "intermedio", badge: "Lo que más cuesta", text: `Lo que más cuesta: ${dims[0].label} (${pct(v)}) y ${dims[1].label} (${pct(s.dims[dims[1].key])}).`, href: "/admin/conceptos", cta: "Ver conceptos y prácticas" });
  }
  const weak = items.filter((it) => {
    const st = itemStatus(it.p, it.rpb);
    return st.tone === "bajo" || st.tone === "critico";
  });
  out.push(
    weak.length
      ? { tone: "intermedio", badge: "Revisar", text: `${weak.length === 1 ? "1 misión casi no separa" : `${weak.length} misiones casi no separan`} a los chicos que rinden más de los que rinden menos: ${list(weak.map((w) => w.id))}.`, href: "/admin/items", cta: "Ver calidad de las misiones" }
      : { tone: "bien", badge: "Prueba", text: "Todas las misiones separan bien o aceptablemente a los chicos.", href: "/admin/items", cta: "Ver calidad de las misiones" },
  );
  return out;
}

// ───────── Errores y atención ─────────

const pts = (x: number) => `${Math.round(x * 100)} ${Math.round(x * 100) === 1 ? "punto" : "puntos"}`;

export function errorsInsight(patterns: ItemPattern[], n: number): string {
  const valid = patterns.filter((p) => Number.isFinite(p.err) && p.diagnosis.key !== "sin-datos");
  if (!valid.length) return "";
  const top = [...valid].sort((a, b) => b.err - a.err).slice(0, 3);
  const parts = [`Donde más se equivocan: ${list(top.map((p) => `${p.id} (${pct(p.err)})`))}.`];
  const hard = valid.filter((p) => p.diagnosis.key === "dificil").sort((a, b) => b.jump - a.jump);
  const rush = valid.filter((p) => p.diagnosis.key === "apuro");
  if (hard.length)
    parts.push(
      hard.length === 1
        ? `${hard[0].id} no sigue la línea: tiene ${pts(hard[0].jump)} más de errores que sus vecinas, aun entre los que se tomaron su tiempo. Es más difícil de lo que le toca por su lugar.`
        : `${list(hard.map((p) => p.id))} no siguen la línea: tienen ${list(hard.map((p) => pts(p.jump)))} más de errores que sus vecinas, aun entre los que se tomaron su tiempo. Son más difíciles de lo que les toca por su lugar.`,
    );
  if (rush.length) parts.push(`En ${list(rush.map((p) => p.id))} los errores se explican sobre todo por respuestas apuradas: es más falta de atención que dificultad.`);
  const lineTop = top.filter((p) => p.diagnosis.key === "linea");
  if (lineTop.length)
    parts.push(
      lineTop.length === 1
        ? `${lineTop[0].id} sigue la línea: cuesta porque la prueba se pone más difícil a medida que avanza.`
        : `${list(lineTop.map((p) => p.id))} siguen la línea: cuestan porque la prueba se pone más difícil a medida que avanza.`,
    );
  if (!hard.length && !rush.length) parts.push("Ninguna misión se sale de la línea: los errores crecen de a poco, como se esperaba.");
  if (n < FEW_DATA) parts.push(`Con ${chicos(n)}, el diagnóstico es orientativo.`);
  return parts.join(" ");
}

export function thinkingInsight(patterns: ItemPattern[]): string {
  const wrong = patterns.reduce((a, p) => a + p.wrongCareful, 0);
  const rushedWrong = patterns.reduce((a, p) => a + (p.rushed - p.rushedRight), 0);
  const total = wrong + rushedWrong;
  if (!total) return "";
  const parts = [`De todos los errores, ${pct(wrong / total)} fueron con tiempo normal (se equivocaron pensando) y ${pct(rushedWrong / total)} fueron respuestas apuradas.`];
  const worstRush = [...patterns].filter((p) => p.reached >= 5).sort((a, b) => b.rushedShare - a.rushedShare)[0];
  if (worstRush && worstRush.rushedShare >= 0.1) parts.push(`La misión con más apuro es ${worstRush.id}: ${pct(worstRush.rushedShare)} la contestó sin llegar a leerla.`);
  const noReach = patterns.filter((p) => p.n && p.noReach / p.n >= 0.1);
  if (noReach.length) {
    const most = Math.max(...noReach.map((p) => p.noReach / p.n));
    parts.push(`${list(noReach.map((p) => p.id))} ${noReach.length === 1 ? "tiene" : "tienen"} chicos que no llegaron porque se terminó el tiempo (hasta ${pct(most)}).`);
  }
  return parts.join(" ");
}

export function fatigueInsight(thirds: { share: number }[], acc: { rushed: number; right: number }, bySchool: { name: string; final: number }[]): string {
  if (!thirds.every((t) => Number.isFinite(t.share))) return "";
  const [a, , c] = thirds;
  const parts = [`Al principio, ${pct(a.share)} de las respuestas fueron apuradas; al final, ${pct(c.share)}.`];
  parts.push(
    c.share >= a.share + 0.04
      ? "El apuro crece hacia el final: hay chicos que llegan cansados o desatentos a las últimas misiones."
      : "El apuro casi no cambia a lo largo de la prueba: no se ve cansancio al final.",
  );
  if (acc.rushed >= 10) {
    const r = acc.right / acc.rushed;
    parts.push(`Las respuestas apuradas acertaron ${pct(r)}${r < 0.4 ? ", casi como al azar (25%): son chicos que contestan sin leer, no chicos que saben y van rápido" : ""}.`);
  }
  const valid = bySchool.filter((s) => Number.isFinite(s.final));
  if (valid.length > 1) {
    const worst = [...valid].sort((x, y) => y.final - x.final)[0];
    const best = [...valid].sort((x, y) => x.final - y.final)[0];
    if (worst.final - best.final >= 0.05) parts.push(`Al final, ${worst.name} es el colegio con más apuro (${pct(worst.final)}) y ${best.name} el de menos (${pct(best.final)}).`);
  }
  return parts.join(" ");
}

export function signalsInsight(rows: { name: string; n: number; many: number }[], total: { n: number; many: number; one: number }): string {
  if (!total.n) return "";
  const parts = [
    total.many
      ? `${total.many} de ${total.n} chicos (${pct(total.many / total.n)}) muestran varias señales de desatención: su puntaje probablemente es menor que lo que saben.`
      : "Ningún chico muestra varias señales de desatención.",
  ];
  if (total.one) parts.push(`${total.one === 1 ? "1 chico muestra" : `${total.one} chicos muestran`} una sola señal, que puede ser casualidad.`);
  const withMany = rows.filter((r) => r.many > 0).sort((a, b) => b.many / b.n - a.many / a.n);
  if (rows.length > 1 && withMany.length) parts.push(`Por colegio: ${list(withMany.map((r) => `${r.name}, ${r.many} de ${r.n}`))}.`);
  return parts.join(" ");
}

// ───────── Tiempos ─────────

type TimeGroup = { name: string; n: number; total: TimeStats; missions: TimeStats; timedOut: number };

export function totalTimeInsight(all: TimeGroup, bySchool: TimeGroup[]): string {
  if (!all.total.n) return "";
  const parts = [
    `El chico típico tardó ${fmt(all.total.median, 0)} minutos en toda la prueba; la mitad central, de ${fmt(all.total.q1, 0)} a ${fmt(all.total.q3, 0)}.`,
    `Resolviendo misiones, ${fmt(all.missions.median, 0)} minutos: el resto se va en la explicación y las prácticas.`,
    all.timedOut ? `${all.timedOut} de ${all.n} (${pct(all.timedOut / all.n)}) se ${all.timedOut === 1 ? "quedó" : "quedaron"} sin tiempo.` : "Todos terminaron antes de los 45 minutos.",
  ];
  const valid = bySchool.filter((s) => s.total.n >= 2);
  if (valid.length > 1) {
    const slow = [...valid].sort((a, b) => b.total.median - a.total.median)[0];
    const fast = [...valid].sort((a, b) => a.total.median - b.total.median)[0];
    if (slow.total.median - fast.total.median >= 3) parts.push(`${slow.name} es el más lento (${fmt(slow.total.median, 0)} min) y ${fast.name} el más rápido (${fmt(fast.total.median, 0)} min).`);
    const out = valid.filter((s) => s.timedOut > 0).sort((a, b) => b.timedOut / b.n - a.timedOut / a.n);
    if (out.length && all.timedOut > 1) parts.push(`Los que no terminaron son de ${list(out.map((s) => `${s.name} (${s.timedOut})`))}.`);
  }
  return parts.join(" ");
}

export function itemTimeInsight(times: { id: string; all: TimeStats }[]): string {
  const valid = times.filter((t) => Number.isFinite(t.all.median));
  if (!valid.length) return "";
  const sorted = [...valid].sort((a, b) => b.all.median - a.all.median);
  const slow = sorted.slice(0, 3);
  const fast = sorted.slice(-2).reverse();
  const a = valid.filter((t) => t.id.startsWith("A")).map((t) => t.all.median);
  const b = valid.filter((t) => t.id.startsWith("B")).map((t) => t.all.median);
  const parts = [`Las misiones que más tiempo llevan son ${list(slow.map((t) => `${t.id} (${fmt(t.all.median, 0)} s)`))}; las más rápidas, ${list(fast.map((t) => `${t.id} (${fmt(t.all.median, 0)} s)`))}.`];
  if (a.length && b.length) parts.push(`En la Parte A, una misión típica lleva ${fmt(median(a), 0)} s; en la Parte B, ${fmt(median(b), 0)} s.`);
  return parts.join(" ");
}

export function schoolTimeInsight(rows: { name: string; values: number[] }[], all: number[]): string {
  if (rows.length < 2) return rows.length ? "Con un solo colegio no hay con quién comparar. Sacá el filtro de colegio." : "";
  const count = (r: { values: number[] }, f: (v: number, ref: number) => boolean) => r.values.filter((v, i) => Number.isFinite(v) && Number.isFinite(all[i]) && f(v, all[i])).length;
  const slower = rows.map((r) => ({ name: r.name, k: count(r, (v, ref) => v > ref * 1.1) })).sort((a, b) => b.k - a.k)[0];
  const faster = rows.map((r) => ({ name: r.name, k: count(r, (v, ref) => v < ref * 0.9) })).sort((a, b) => b.k - a.k)[0];
  const parts: string[] = [];
  if (slower.k >= 5) parts.push(`${slower.name} tarda más que el total en ${slower.k} de las ${all.length} misiones.`);
  if (faster.k >= 5 && faster.name !== slower.name) parts.push(`${faster.name} es más rápido que el total en ${faster.k}.`);
  if (!parts.length) parts.push("Los colegios tardan parecido en casi todas las misiones.");
  return parts.join(" ");
}

export function rightWrongInsight(times: { id: string; right: number; wrong: number }[]): string {
  const both = times.filter((t) => Number.isFinite(t.right) && Number.isFinite(t.wrong));
  if (!both.length) return "";
  const slowerWrong = both.filter((t) => t.wrong > t.right * 1.15);
  const fasterWrong = both.filter((t) => t.wrong < t.right * 0.85);
  const parts = [`En ${slowerWrong.length} de ${both.length} misiones los que se equivocaron tardaron más que los que acertaron: se trabaron, la misión les costó.`];
  parts.push(
    fasterWrong.length
      ? `En ${list(fasterWrong.map((t) => t.id))} los que se equivocaron fueron más rápidos: la contestaron sin pensarla del todo.`
      : "En ninguna los que se equivocaron fueron claramente más rápidos.",
  );
  return parts.join(" ");
}
