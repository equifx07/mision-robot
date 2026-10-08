// Generación de pruebas de demostración con datos verosímiles (nombres, tiempos, fechas)
// para ver el panel con datos. Se marcan con device = "demo" para poder borrarlas de una vez.
import { getDb } from "./db";
import { ITEMS } from "./items";
import { createAttempt, finishAttempt, listSchools, saveAnswer } from "./repo";
import { testOf, type Grade } from "./tests";

export const DEMO_DEVICE = "demo";

const FIRST = [
  "Valentina", "Santiago", "Martina", "Mateo", "Sofía", "Benjamín", "Emma", "Thiago", "Isabella", "Joaquín",
  "Catalina", "Bautista", "Olivia", "Felipe", "Julieta", "Lorenzo", "Emilia", "Juan Cruz", "Delfina", "Lucas",
  "Renata", "Tomás", "Francesca", "Agustín", "Guadalupe", "Ignacio", "Lola", "Simón", "Ámbar", "Facundo",
  "Milagros", "Dante", "Zoe", "Ramiro", "Alma", "Franco", "Josefina", "Nicolás", "Pilar", "Manuel",
];
const LAST = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez", "García", "Sánchez",
  "Romero", "Sosa", "Torres", "Álvarez", "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina",
  "Herrera", "Suárez", "Aguirre", "Giménez", "Molina", "Pereyra", "Castro", "Rojas", "Ortiz", "Silva",
];

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Fecha de inicio ficticia: un día hábil de las últimas dos semanas, en horario escolar (hora Argentina). */
function schoolDay(): Date {
  for (let tries = 0; tries < 20; tries++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1 - Math.floor(Math.random() * 13));
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const hourAr = pick([8, 9, 10, 11, 14, 15]);
    d.setUTCHours(hourAr + 3, Math.floor(Math.random() * 50), 0, 0);
    return d;
  }
  return new Date(Date.now() - 86400000);
}

// Misiones que en la demo son más difíciles o más fáciles que su lugar en la prueba (inventado, para
// que el panel muestre misiones fuera de la línea).
const DEMO_BUMP: Record<string, number> = { "A5.2": 1.1, B6: 0.9, "A3.1": -0.7 };

export type DemoOptions = {
  schoolId: number;
  grade: Grade;
  /** Cantidad de chicos a generar. */
  count: number;
  /** Desplazamiento de habilidad del colegio (en desvíos): 0 = promedio. */
  abilityShift?: number;
};

export function generateDemo(opts: DemoOptions): { created: number } {
  const school = listSchools().find((x) => x.id === opts.schoolId);
  if (!school) throw new Error("Colegio inexistente");
  const test = testOf(opts.grade);
  const bankA = ITEMS.filter((it) => it.part === "A").map((it) => it.id);
  const db = getDb();
  let created = 0;
  const usedNames = new Set<string>();
  for (let i = 0; i < opts.count; i++) {
    let name = `${pick(FIRST)} ${pick(LAST)}`;
    while (usedNames.has(name)) name = `${pick(FIRST)} ${pick(LAST)}`;
    usedNames.add(name);
    const priorExp = pick(["nunca", "nunca", "algunas", "algunas", "siempre"]);
    // Los de 4.º resuelven con menos soltura las mismas misiones.
    const gradeShift = test.grade === "4" ? -0.6 : 0;
    const ability = (opts.abilityShift ?? 0) + gradeShift + gauss() * 0.9 + (priorExp === "siempre" ? 0.5 : priorExp === "algunas" ? 0.2 : 0);
    const attempt = createAttempt({
      schoolId: school.id,
      grade: test.grade,
      studentName: name,
      age: test.grade === "4" ? (Math.random() < 0.8 ? 9 : 10) : Math.random() < 0.8 ? 11 : 12,
      priorExp,
      gender: pick(["femenino", "masculino", "femenino", "masculino", "no_dice"]),
      device: DEMO_DEVICE,
      userAgent: "generador de datos de prueba",
      screen: "1366x768",
    });
    // Ritmo propio (algunos muy lentos) y, en algunos, cansancio desde una misión: a partir de ahí
    // contestan cada vez más seguido apurados, sin leer. No hay límite de tiempo.
    const n = test.items.length;
    const pace = Math.random() < 0.06 ? 2.1 + Math.random() * 0.5 : Math.exp(gauss() * 0.25);
    const tiresAt = Math.random() < 0.18 ? Math.round(n * 0.45) + Math.floor(Math.random() * Math.round(n * 0.45)) : Infinity;
    const tutorialMs = Math.round((6 + Math.random() * 6) * 60000);
    let totalItemMs = 0;
    test.items.forEach((item, idx) => {
      const bankPos = bankA.indexOf(item.id);
      const difficulty = (item.part === "A" ? -1.2 + (bankPos / 19) * 2.6 : 0.2 + gauss() * 0.3) + (DEMO_BUMP[item.id] ?? 0);
      const rushed = idx >= tiresAt && Math.random() < Math.min(0.8, 0.35 + 0.06 * (idx - tiresAt));
      let correct: boolean;
      let timeMs: number;
      if (rushed) {
        correct = Math.random() < 0.25;
        timeMs = Math.round((1.2 + Math.random() * 2.6) * 1000);
      } else {
        correct = Math.random() < 0.25 + 0.75 * sigmoid(1.4 * (ability - difficulty));
        const base = item.part === "A" ? 24 + 14 * (difficulty + 1.2) : 44;
        timeMs = Math.round(Math.max(6, base * pace * Math.exp(gauss() * 0.35) * (correct ? 1 : 1.15)) * 1000);
      }
      totalItemMs += timeMs;
      saveAnswer(attempt.id, item.id, correct ? item.correct : pick([1, 2, 3]), timeMs, null, null);
    });
    finishAttempt(attempt.id);
    const started = schoolDay();
    const durationMs = totalItemMs + tutorialMs; // + tutorial y prácticas
    const finished = new Date(started.getTime() + durationMs);
    db.prepare("UPDATE attempts SET started_at = ?, finished_at = ?, total_ms = ? WHERE id = ?").run(started.toISOString(), finished.toISOString(), durationMs, attempt.id);
    db.prepare("UPDATE answers SET shown_at = NULL, answered_at = NULL WHERE attempt_id = ?").run(attempt.id);
    created++;
  }
  return { created };
}

export function deleteDemo(): number {
  const r = getDb().prepare("DELETE FROM attempts WHERE device = ?").run(DEMO_DEVICE);
  return Number(r.changes);
}

export function countDemo(): number {
  const r = getDb().prepare("SELECT COUNT(*) AS n FROM attempts WHERE device = ?").get(DEMO_DEVICE) as { n: number } | undefined;
  return r?.n ?? 0;
}
