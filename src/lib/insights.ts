// "Qué se observa": conclusiones cortas, en castellano llano, calculadas con los datos que se
// están mostrando (cambian con los filtros). Cada función recibe lo mismo que su gráfico.
import type { SchoolGroup } from "./dashboard";
import { dSize, FEW_DATA, itemStatus } from "./semaforo";
import { cohenD, DIMENSIONS, fmt, type GroupSummary, type ItemStats, LEVELS, levelOfMean, pct } from "./stats";

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
