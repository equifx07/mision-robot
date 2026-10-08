// Patrón de errores, señales de atención y tiempos.
//
// Todos hacen las misiones en el mismo orden, así que la dificultad de una misión y el cansancio de
// estar al final quedan mezclados. Para separarlos se usan los tiempos de respuesta:
// - Respuesta apurada: tardó menos que la décima parte del tiempo típico (mediana) de esa misión,
//   nunca menos de 3 s ni más de 10 s (umbral normativo NT10, Wise y Ma 2012). No alcanza para leerla.
// - Línea esperada de una misión: el promedio de errores de sus vecinas (hasta 2 antes y 2 después,
//   de la misma parte). Si se equivoca mucha más gente que en las vecinas, la misión "no sigue la línea".
// - Si el salto sigue aunque se miren solo las respuestas con tiempo normal, es dificultad. Si el
//   salto desaparece al sacar las apuradas, o si 3 de cada 10 errores (o más) son respuestas apuradas,
//   los errores se explican por apuro (falta de atención). Esto último hace falta porque el cansancio
//   sube de a poco: también sube la línea de las vecinas y no aparece como salto.
// La línea se arma con los datos del grupo que se está mirando (así un colegio que rinde menos en
// general no ve todas sus misiones "fuera de la línea"). Los umbrales de apuro, los tiempos típicos y
// el acierto de referencia se calculan con TODAS las pruebas, para que no cambien al filtrar por colegio.
// Todo es de UNA prueba (4.º o 6.º): la referencia lleva su prueba y las funciones usan sus misiones.
import { listAllAnswers, listAttempts } from "./repo";
import type { Tone } from "./semaforo";
import { mean, median, quantile, scoreAttempts, type Scored } from "./stats";
import type { TestDef } from "./tests";

export const RAPID = { share: 0.1, minMs: 3000, maxMs: 10000 };
/** Salto mínimo (en proporción) para decir que una misión no sigue la línea. */
export const JUMP = 0.15;
const Z = 1.96;
/** Respuestas mínimas para diagnosticar una misión. */
const MIN_N = 5;
/** Errores por apuro: al menos esta parte de los errores son respuestas apuradas… */
export const RUSHED_ERRORS = 0.3;
/** …y al menos esta parte de las respuestas a la misión fueron apuradas. */
const RUSHED_MIN = 0.1;

export type Third = { key: string; label: string; range: string; from: number; to: number };

/** Tercios de una prueba por posición (0-based): principio, medio y final. */
export function thirdsOf(test: TestDef): Third[] {
  const n = test.items.length;
  const k = Math.round(n / 3);
  const parts = [
    { key: "inicio", label: "Al principio", from: 0, to: k - 1 },
    { key: "medio", label: "En el medio", from: k, to: n - k - 1 },
    { key: "final", label: "Al final", from: n - k, to: n - 1 },
  ];
  return parts.map((t) => ({ ...t, range: `misiones ${t.from + 1} a ${t.to + 1}` }));
}
const thirdOf = (thirds: Third[], pos: number) => thirds.findIndex((t) => pos >= t.from && pos <= t.to);

// ───────── Referencia (todas las pruebas terminadas) ─────────

export type Reference = {
  test: TestDef;
  n: number;
  /** Umbral de respuesta apurada por misión (ms). */
  rapidMs: Record<string, number>;
  /** Tiempo típico (mediana) por misión (ms). */
  medianMs: Record<string, number>;
  /** Proporción de acierto por misión, entre los que la respondieron. */
  p: Record<string, number>;
};

const answered = (r: Scored, id: string) => r.chosen[id] !== null && r.chosen[id] !== undefined;
const timeOf = (r: Scored, id: string) => {
  const t = r.times[id];
  return t !== null && t !== undefined && t > 0 ? t : null;
};

export function isRapid(ref: Reference, id: string, ms: number | null): boolean {
  return ms !== null && ms < ref.rapidMs[id];
}

/** Promedio de las vecinas en la prueba (hasta 2 de cada lado, misma parte), sin la misión misma. */
function neighbors(test: TestDef, values: Record<string, number>, id: string): number {
  const items = test.items;
  const idx = items.findIndex((i) => i.id === id);
  const part = items[idx].part;
  const near: number[] = [];
  for (let k = idx - 2; k <= idx + 2; k++) {
    if (k === idx || k < 0 || k >= items.length || items[k].part !== part) continue;
    const v = values[items[k].id];
    if (Number.isFinite(v)) near.push(v);
  }
  return near.length ? mean(near) : NaN;
}

export function buildReference(test: TestDef, rows: Scored[]): Reference {
  const rapidMs: Record<string, number> = {};
  const medianMs: Record<string, number> = {};
  const p: Record<string, number> = {};
  for (const it of test.items) {
    const times = rows.map((r) => timeOf(r, it.id)).filter((t): t is number => t !== null);
    const med = times.length ? median(times) : NaN;
    medianMs[it.id] = med;
    rapidMs[it.id] = Number.isFinite(med) ? Math.min(RAPID.maxMs, Math.max(RAPID.minMs, RAPID.share * med)) : RAPID.minMs;
  }
  for (const it of test.items) {
    const resp = rows.filter((r) => answered(r, it.id));
    p[it.id] = resp.length ? mean(resp.map((r) => r.correct[it.id])) : NaN;
  }
  return { test, n: rows.length, rapidMs, medianMs, p };
}

/** Referencia con todas las pruebas terminadas de ese grado (sin filtros de colegio). */
export function loadReference(test: TestDef): Reference {
  const attempts = listAttempts({ grade: test.grade }).filter((a) => a.status !== "in_progress");
  return buildReference(test, scoreAttempts(test, attempts, listAllAnswers(attempts.map((a) => a.id))));
}

// ───────── Patrón de errores por misión ─────────

export type Diagnosis = { key: "dificil" | "apuro" | "linea" | "facil" | "sin-datos"; label: string; tone: Tone };

export const DIAGNOSES: Record<Diagnosis["key"], Diagnosis & { meaning: string }> = {
  dificil: { key: "dificil", label: "Más difícil que la línea", tone: "bajo", meaning: "Se equivocan mucho más que en las vecinas, aun los que se tomaron su tiempo: la misión es más difícil de lo que le toca por su lugar." },
  apuro: { key: "apuro", label: "Errores por apuro", tone: "regular", meaning: "3 de cada 10 errores o más son respuestas apuradas, o el salto de errores desaparece al sacarlas: se equivocan más por falta de atención que por dificultad." },
  linea: { key: "linea", label: "Sigue la línea", tone: "neutro", meaning: "Tiene una cantidad de errores parecida a la de sus vecinas: es tan difícil como le toca por su lugar." },
  facil: { key: "facil", label: "Más fácil que la línea", tone: "bien", meaning: "Se equivocan bastante menos que en las vecinas." },
  "sin-datos": { key: "sin-datos", label: "Faltan datos", tone: "neutro", meaning: "Menos de 5 chicos la respondieron." },
};

export type ItemPattern = {
  id: string;
  pos: number; // posición en la prueba (desde 1)
  part: "A" | "B";
  n: number; // chicos del grupo
  reached: number; // la respondieron
  noReach: number; // no llegaron (se terminó el tiempo)
  right: number;
  wrongCareful: number; // se equivocaron con tiempo normal
  rushed: number; // respuestas apuradas (bien o mal)
  rushedRight: number;
  err: number; // errores / respondieron
  errCareful: number; // errores entre las respuestas con tiempo normal
  expected: number;
  expectedCareful: number;
  jump: number;
  jumpCareful: number;
  rushedShare: number;
  /** Parte de los errores que fueron respuestas apuradas. */
  rushedErrShare: number;
  diagnosis: Diagnosis;
};

function significant(diff: number, base: number, n: number): boolean {
  const q = Math.min(0.95, Math.max(0.05, base));
  return Math.abs(diff) / Math.sqrt((q * (1 - q)) / n) >= Z;
}

export function itemPatterns(rows: Scored[], ref: Reference): ItemPattern[] {
  const test = ref.test;
  const base = test.items.map((it, i) => {
    let reached = 0;
    let right = 0;
    let wrongCareful = 0;
    let rushed = 0;
    let rushedRight = 0;
    for (const r of rows) {
      if (!answered(r, it.id)) continue;
      reached++;
      const ok = r.correct[it.id] === 1;
      if (isRapid(ref, it.id, timeOf(r, it.id))) {
        rushed++;
        if (ok) rushedRight++;
      } else if (ok) right++;
      else wrongCareful++;
    }
    const careful = reached - rushed;
    const wrong = reached - right - rushedRight;
    return { it, i, reached, right, wrongCareful, rushed, rushedRight, careful, err: reached ? wrong / reached : NaN, errCareful: careful ? wrongCareful / careful : NaN };
  });
  const errs = Object.fromEntries(base.map((b) => [b.it.id, b.err]));
  const errsCareful = Object.fromEntries(base.map((b) => [b.it.id, b.errCareful]));
  return base.map(({ it, i, reached, right, wrongCareful, rushed, rushedRight, careful, err, errCareful }) => {
    const expected = neighbors(test, errs, it.id);
    const expectedCareful = neighbors(test, errsCareful, it.id);
    const jump = err - expected;
    const jumpCareful = errCareful - expectedCareful;
    const rushedShare = reached ? rushed / reached : NaN;
    const wrong = reached - right - rushedRight;
    const rushedErrShare = wrong ? (rushed - rushedRight) / wrong : 0;
    const byRush = rushedShare >= RUSHED_MIN && rushedErrShare >= RUSHED_ERRORS;
    let diagnosis = DIAGNOSES.linea as Diagnosis;
    if (reached < MIN_N || !Number.isFinite(expected)) diagnosis = DIAGNOSES["sin-datos"];
    else if (jump >= JUMP && significant(jump, expected, reached))
      diagnosis = careful >= MIN_N && jumpCareful >= JUMP ? DIAGNOSES.dificil : DIAGNOSES.apuro;
    else if (byRush) diagnosis = DIAGNOSES.apuro;
    else if (jump <= -JUMP && significant(jump, expected, reached)) diagnosis = DIAGNOSES.facil;
    return {
      id: it.id,
      pos: i + 1,
      part: it.part,
      n: rows.length,
      reached,
      noReach: rows.length - reached,
      right: right + rushedRight,
      wrongCareful,
      rushed,
      rushedRight,
      err,
      errCareful,
      expected,
      expectedCareful,
      jump,
      jumpCareful,
      rushedShare,
      rushedErrShare,
      diagnosis,
    };
  });
}

/** Respuestas apuradas por tercio de la prueba: proporción y cuántas acertaron. */
export function rushedByThird(rows: Scored[], ref: Reference): { share: number; rushed: number; answered: number }[] {
  const items = ref.test.items;
  return thirdsOf(ref.test).map((t) => {
    let rushed = 0;
    let total = 0;
    for (const r of rows)
      for (let k = t.from; k <= t.to; k++) {
        const id = items[k].id;
        if (!answered(r, id)) continue;
        total++;
        if (isRapid(ref, id, timeOf(r, id))) rushed++;
      }
    return { share: total ? rushed / total : NaN, rushed, answered: total };
  });
}

/** Cuántas respuestas apuradas hubo en total y qué proporción acertó (al azar sería 25%). */
export function rushedAccuracy(rows: Scored[], ref: Reference): { rushed: number; answered: number; right: number } {
  let rushed = 0;
  let right = 0;
  let total = 0;
  for (const r of rows)
    for (const it of ref.test.items) {
      if (!answered(r, it.id)) continue;
      total++;
      if (isRapid(ref, it.id, timeOf(r, it.id))) {
        rushed++;
        right += r.correct[it.id];
      }
    }
  return { rushed, answered: total, right };
}

// ───────── Señales de atención por chico ─────────

export const SIGNAL = {
  /** Respuestas apuradas para que cuente como señal. */
  rushed: 3,
  /** Caída: cuánto peor le va respecto del resto al final que al principio (en proporción). */
  drop: 0.4,
  /** Se apuró: su ritmo al final es al menos el doble de rápido que al principio, comparado con el resto. */
  speed: 0.5,
};

export type SignalKey = "apuro" | "caida" | "acelero";
export const SIGNAL_LABEL: Record<SignalKey, string> = {
  apuro: "Respuestas apuradas",
  caida: "Rinde menos al final",
  acelero: "Se apuró al final",
};

export type StudentSignals = {
  scored: Scored;
  answered: number;
  rushed: number;
  rushedIds: string[];
  /** Ventaja sobre el resto al principio menos ventaja al final (positivo = cayó). */
  drop: number;
  /** Ritmo al final / ritmo al principio, relativo al tiempo típico de cada misión (menos de 1 = más rápido). */
  speed: number;
  signals: SignalKey[];
};

export function attentionStatus(count: number): { tone: Tone; label: string } {
  return count === 0 ? { tone: "bien", label: "Sin señales" } : count === 1 ? { tone: "intermedio", label: "Una señal" } : { tone: "bajo", label: "Varias señales" };
}

export function studentSignals(r: Scored, ref: Reference): StudentSignals {
  let answeredN = 0;
  const rushedIds: string[] = [];
  const adv: number[][] = [[], [], []];
  const pace: number[][] = [[], [], []];
  const thirds = thirdsOf(ref.test);
  ref.test.items.forEach((it, pos) => {
    if (!answered(r, it.id)) return;
    answeredN++;
    const t = timeOf(r, it.id);
    if (isRapid(ref, it.id, t)) rushedIds.push(it.id);
    const third = thirdOf(thirds, pos);
    if (Number.isFinite(ref.p[it.id])) adv[third].push(r.correct[it.id] - ref.p[it.id]);
    if (t !== null && Number.isFinite(ref.medianMs[it.id])) pace[third].push(t / ref.medianMs[it.id]);
  });
  const drop = adv[0].length >= 5 && adv[2].length >= 5 ? mean(adv[0]) - mean(adv[2]) : NaN;
  const speed = pace[0].length >= 5 && pace[2].length >= 5 ? median(pace[2]) / median(pace[0]) : NaN;
  const signals: SignalKey[] = [];
  if (rushedIds.length >= SIGNAL.rushed) signals.push("apuro");
  if (drop >= SIGNAL.drop) signals.push("caida");
  if (speed <= SIGNAL.speed) signals.push("acelero");
  return { scored: r, answered: answeredN, rushed: rushedIds.length, rushedIds, drop, speed, signals };
}

// ───────── Tiempos ─────────

export type TimeStats = { n: number; median: number; q1: number; q3: number; min: number; max: number };

export function timeStats(xs: number[]): TimeStats {
  return {
    n: xs.length,
    median: median(xs),
    q1: quantile(xs, 0.25),
    q3: quantile(xs, 0.75),
    min: xs.length ? Math.min(...xs) : NaN,
    max: xs.length ? Math.max(...xs) : NaN,
  };
}

/** Segundos por misión del grupo: todos, los que acertaron y los que se equivocaron (sin apuradas). */
export function itemTimes(rows: Scored[], ref: Reference): { id: string; all: TimeStats; right: number; wrong: number }[] {
  return ref.test.items.map((it) => {
    const all: number[] = [];
    const right: number[] = [];
    const wrong: number[] = [];
    for (const r of rows) {
      const t = timeOf(r, it.id);
      if (t === null || !answered(r, it.id)) continue;
      all.push(t / 1000);
      if (isRapid(ref, it.id, t)) continue;
      (r.correct[it.id] ? right : wrong).push(t / 1000);
    }
    return { id: it.id, all: timeStats(all), right: right.length >= 3 ? median(right) : NaN, wrong: wrong.length >= 3 ? median(wrong) : NaN };
  });
}

/** Minutos de la prueba por chico: completa (con la explicación) y resolviendo misiones. */
export function testMinutes(rows: Scored[]): { total: number[]; missions: number[] } {
  const total: number[] = [];
  const missions: number[] = [];
  for (const r of rows) {
    if (r.totalTimeMs && r.totalTimeMs > 0) total.push(r.totalTimeMs / 60000);
    const sum = Object.values(r.times).reduce<number>((acc, t) => acc + (t && t > 0 ? t : 0), 0);
    if (sum > 0) missions.push(sum / 60000);
  }
  return { total, missions };
}
