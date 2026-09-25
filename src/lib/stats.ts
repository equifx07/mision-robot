// Estadísticas descriptivas y psicométricas para el panel.
import { ITEMS, ITEMS_A } from "./items";
import type { Item, ItemA } from "./model";
import type { Answer, AttemptRow } from "./repo";

export const MAX_SCORE = ITEMS.length;

export type Level = { key: string; name: string; min: number; max: number };
export const LEVELS: Level[] = [
  { key: "inicial", name: "Inicial", min: 0, max: 9 },
  { key: "desarrollo", name: "En desarrollo", min: 10, max: 16 },
  { key: "logrado", name: "Logrado", min: 17, max: 22 },
  { key: "avanzado", name: "Avanzado", min: 23, max: 28 },
];

export function levelOf(score: number): Level {
  return LEVELS.find((l) => score >= l.min && score <= l.max) ?? LEVELS[0];
}

export const CONCEPT_LABEL: Record<ItemA["concept"], string> = {
  secuencias: "Secuencias",
  repetir: "Repetir N veces",
  hasta: "Repetir hasta / mientras",
  anidados: "Bucles anidados",
  si: "Si (condicional)",
  "si-sino": "Si / si no",
  funciones: "Funciones",
};
export const TASK_LABEL: Record<ItemA["task"], string> = { S: "Secuenciar", C: "Completar", D: "Depurar", E: "Evaluar" };
export const PRACTICE_LABEL: Record<string, string> = {
  descomposicion: "Descomposición",
  patrones: "Patrones",
  representacion: "Representación",
  abstraccion: "Abstracción",
  algoritmo: "Seguir algoritmo",
  evaluar: "Evaluar",
  logica: "Lógica",
};

const CONCEPT_SHORT: Record<ItemA["concept"], string> = {
  secuencias: "Sec",
  repetir: "RepN",
  hasta: "Hasta",
  anidados: "Anid",
  si: "Si",
  "si-sino": "SiNo",
  funciones: "Func",
};
const PRACTICE_SHORT: Record<string, string> = {
  descomposicion: "Desc",
  patrones: "Patr",
  representacion: "Repr",
  abstraccion: "Abst",
  algoritmo: "Alg",
  evaluar: "Eval",
  logica: "Lóg",
};

export function dimensionOf(item: Item): { key: string; label: string; short: string; group: "concepto" | "practica" } {
  if (item.part === "A") return { key: `c:${item.concept}`, label: CONCEPT_LABEL[item.concept], short: CONCEPT_SHORT[item.concept], group: "concepto" };
  return { key: `p:${item.practice}`, label: PRACTICE_LABEL[item.practice] ?? item.practice, short: PRACTICE_SHORT[item.practice] ?? item.practice, group: "practica" };
}

export const DIMENSIONS = (() => {
  const seen = new Map<string, { key: string; label: string; short: string; group: "concepto" | "practica"; items: string[] }>();
  for (const it of ITEMS) {
    const d = dimensionOf(it);
    const e = seen.get(d.key) ?? { ...d, items: [] };
    e.items.push(it.id);
    seen.set(d.key, e);
  }
  return [...seen.values()];
})();

// ───────── descriptivas ─────────

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}
export function sd(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}
export function quantile(xs: number[], q: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export function median(xs: number[]): number {
  return quantile(xs, 0.5);
}
export function ci95(xs: number[]): [number, number] {
  const m = mean(xs);
  const s = sd(xs);
  if (!Number.isFinite(s) || xs.length < 2) return [m, m];
  const h = 1.96 * (s / Math.sqrt(xs.length));
  return [m - h, m + h];
}
export function cohenD(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return NaN;
  const sa = sd(a);
  const sb = sd(b);
  const pooled = Math.sqrt(((a.length - 1) * sa ** 2 + (b.length - 1) * sb ** 2) / (a.length + b.length - 2));
  return pooled === 0 ? 0 : (mean(a) - mean(b)) / pooled;
}
export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return NaN;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}

// ───────── por intento ─────────

export type Scored = {
  attempt: AttemptRow;
  total: number;
  correct: Record<string, 0 | 1>; // por ítem
  times: Record<string, number | null>;
  chosen: Record<string, number | null>;
  byDimension: Record<string, { correct: number; total: number }>;
  byTask: Record<string, { correct: number; total: number }>;
  totalTimeMs: number | null;
};

export function scoreAttempts(attempts: AttemptRow[], answers: Answer[]): Scored[] {
  const byAttempt = new Map<string, Answer[]>();
  for (const a of answers) {
    const list = byAttempt.get(a.attempt_id) ?? [];
    list.push(a);
    byAttempt.set(a.attempt_id, list);
  }
  return attempts.map((attempt) => {
    const list = byAttempt.get(attempt.id) ?? [];
    const byItem = new Map(list.map((a) => [a.item_id, a]));
    const correct: Record<string, 0 | 1> = {};
    const times: Record<string, number | null> = {};
    const chosen: Record<string, number | null> = {};
    const byDimension: Record<string, { correct: number; total: number }> = {};
    const byTask: Record<string, { correct: number; total: number }> = {};
    let total = 0;
    for (const item of ITEMS) {
      const a = byItem.get(item.id);
      const ok: 0 | 1 = a?.is_correct === 1 ? 1 : 0;
      correct[item.id] = ok;
      times[item.id] = a?.time_ms ?? null;
      chosen[item.id] = a?.chosen ?? null;
      total += ok;
      const d = dimensionOf(item).key;
      byDimension[d] = byDimension[d] ?? { correct: 0, total: 0 };
      byDimension[d].correct += ok;
      byDimension[d].total += 1;
      if (item.part === "A") {
        byTask[item.task] = byTask[item.task] ?? { correct: 0, total: 0 };
        byTask[item.task].correct += ok;
        byTask[item.task].total += 1;
      }
    }
    return { attempt, total, correct, times, chosen, byDimension, byTask, totalTimeMs: attempt.total_ms };
  });
}

// ───────── grupo ─────────

export type GroupSummary = {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  ci: [number, number];
  levels: Record<string, number>; // cantidad por nivel
  dims: Record<string, number>; // % de acierto por dimensión
  tasks: Record<string, number>;
  items: Record<string, number>; // dificultad p por ítem
  medianTimeMin: number;
  scores: number[];
};

export function summarize(rows: Scored[]): GroupSummary {
  const scores = rows.map((r) => r.total);
  const levels: Record<string, number> = Object.fromEntries(LEVELS.map((l) => [l.key, 0]));
  for (const s of scores) levels[levelOf(s).key]++;
  const dims: Record<string, number> = {};
  for (const d of DIMENSIONS) {
    const c = rows.reduce((a, r) => a + (r.byDimension[d.key]?.correct ?? 0), 0);
    const t = rows.reduce((a, r) => a + (r.byDimension[d.key]?.total ?? 0), 0);
    dims[d.key] = t ? c / t : NaN;
  }
  const tasks: Record<string, number> = {};
  for (const k of ["S", "C", "D", "E"]) {
    const c = rows.reduce((a, r) => a + (r.byTask[k]?.correct ?? 0), 0);
    const t = rows.reduce((a, r) => a + (r.byTask[k]?.total ?? 0), 0);
    tasks[k] = t ? c / t : NaN;
  }
  const items: Record<string, number> = {};
  for (const it of ITEMS) items[it.id] = rows.length ? mean(rows.map((r) => r.correct[it.id])) : NaN;
  const times = rows.map((r) => r.totalTimeMs).filter((t): t is number => t !== null && t > 0);
  return {
    n: rows.length,
    mean: mean(scores),
    median: median(scores),
    sd: sd(scores),
    min: scores.length ? Math.min(...scores) : NaN,
    max: scores.length ? Math.max(...scores) : NaN,
    q1: quantile(scores, 0.25),
    q3: quantile(scores, 0.75),
    ci: ci95(scores),
    levels,
    dims,
    tasks,
    items,
    medianTimeMin: times.length ? median(times) / 60000 : NaN,
    scores,
  };
}

// ───────── análisis de ítems ─────────

export type ItemStats = {
  id: string;
  p: number; // dificultad
  rpb: number; // discriminación (punto-biserial con el total sin el ítem)
  n: number;
  choices: number[]; // cantidad por opción (índice canónico)
  omitted: number;
  medianTimeS: number;
  flag: "ok" | "facil" | "dificil" | "baja-disc" | "negativa";
};

export function itemAnalysis(rows: Scored[]): ItemStats[] {
  return ITEMS.map((item) => {
    const xs = rows.map((r) => r.correct[item.id]);
    const rest = rows.map((r) => r.total - r.correct[item.id]);
    const p = xs.length ? mean(xs) : NaN;
    const rpb = pearson(xs, rest);
    const choices = [0, 0, 0, 0];
    let omitted = 0;
    for (const r of rows) {
      const c = r.chosen[item.id];
      if (c === null || c === undefined) omitted++;
      else choices[c]++;
    }
    const times = rows.map((r) => r.times[item.id]).filter((t): t is number => t !== null && t > 0);
    let flag: ItemStats["flag"] = "ok";
    if (Number.isFinite(rpb) && rpb < 0) flag = "negativa";
    else if (Number.isFinite(rpb) && rpb < 0.2) flag = "baja-disc";
    else if (p > 0.9) flag = "facil";
    else if (p < 0.25) flag = "dificil";
    return { id: item.id, p, rpb, n: xs.length, choices, omitted, medianTimeS: times.length ? median(times) / 1000 : NaN, flag };
  });
}

export function cronbachAlpha(rows: Scored[], itemIds: string[] = ITEMS.map((i) => i.id)): number {
  if (rows.length < 3) return NaN;
  const k = itemIds.length;
  const totals = rows.map((r) => itemIds.reduce((a, id) => a + r.correct[id], 0));
  const varTotal = sd(totals) ** 2;
  if (!varTotal) return NaN;
  const sumVar = itemIds.reduce((acc, id) => acc + sd(rows.map((r) => r.correct[id])) ** 2, 0);
  return (k / (k - 1)) * (1 - sumVar / varTotal);
}

export function fmt(x: number, digits = 1): string {
  return Number.isFinite(x) ? x.toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "–";
}
export function pct(x: number): string {
  return Number.isFinite(x) ? `${Math.round(x * 100)}%` : "–";
}

export { ITEMS_A };
