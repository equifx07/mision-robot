// Operaciones sobre la base de datos (colegios, intentos, respuestas).
// Hay dos pruebas (4.º y 6.º): cada intento guarda su grado y se corrige con las misiones de esa prueba.
import { randomUUID } from "node:crypto";
import { getDb, type Row } from "./db";
import { itemById } from "./items";
import { testOf, type Grade } from "./tests";

export type School = { id: number; name: string };

export type Attempt = {
  id: string;
  school_id: number;
  grade: Grade;
  student_name: string;
  age: number | null;
  prior_exp: string | null;
  gender: string | null;
  device: string | null;
  user_agent: string | null;
  screen: string | null;
  test_version: string;
  option_orders: Record<string, number[]>;
  started_at: string;
  finished_at: string | null;
  total_ms: number | null;
  /** "timed_out" solo existía con el límite de 45 minutos; ya no se genera. */
  status: "in_progress" | "finished" | "timed_out";
  score: number | null;
  score_a: number | null;
  score_b: number | null;
};

export type Answer = {
  attempt_id: string;
  item_id: string;
  position: number;
  chosen: number | null;
  is_correct: number | null;
  time_ms: number | null;
  shown_at: string | null;
  answered_at: string | null;
};

// ───────── Colegios ─────────

export function listSchools(): School[] {
  return getDb().prepare("SELECT id, name FROM schools ORDER BY name").all() as unknown as School[];
}

export function createSchool(name: string): number {
  const r = getDb().prepare("INSERT INTO schools (name) VALUES (?)").run(name.trim());
  return Number(r.lastInsertRowid);
}

export function renameSchool(id: number, name: string): void {
  getDb().prepare("UPDATE schools SET name = ? WHERE id = ?").run(name.trim(), id);
}

/** Borra el colegio y todas sus pruebas (las respuestas se borran en cascada). */
export function deleteSchool(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM attempts WHERE school_id = ?").run(id);
  db.prepare("DELETE FROM schools WHERE id = ?").run(id);
}

/** Pruebas por colegio y grado: { [schoolId]: { "4": n, "6": n } }. */
export function countAttemptsBySchool(): Record<number, Record<string, number>> {
  const rows = getDb().prepare("SELECT school_id, grade, COUNT(*) AS n FROM attempts GROUP BY school_id, grade").all() as { school_id: number; grade: string; n: number }[];
  const out: Record<number, Record<string, number>> = {};
  for (const r of rows) (out[r.school_id] ??= {})[r.grade] = r.n;
  return out;
}

// ───────── Intentos ─────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rowToAttempt(r: Row): Attempt {
  return {
    ...(r as unknown as Attempt),
    option_orders: JSON.parse(String(r.option_orders)),
  };
}

export type NewAttempt = {
  schoolId: number;
  grade: Grade;
  studentName: string;
  age?: number | null;
  priorExp?: string | null;
  gender?: string | null;
  device?: string | null;
  userAgent?: string | null;
  screen?: string | null;
};

export function createAttempt(input: NewAttempt): Attempt {
  const db = getDb();
  const school = db.prepare("SELECT id FROM schools WHERE id = ?").get(input.schoolId);
  if (!school) throw new Error("Colegio inválido");
  const test = testOf(input.grade);
  const id = randomUUID();
  const orders: Record<string, number[]> = {};
  for (const item of test.items) orders[item.id] = shuffle(item.options.map((_, i) => i));
  const startedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO attempts (id, school_id, grade, student_name, age, prior_exp, gender, device, user_agent, screen, test_version, option_orders, started_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')`,
  ).run(
    id,
    input.schoolId,
    test.grade,
    input.studentName.trim(),
    input.age ?? null,
    input.priorExp ?? null,
    input.gender ?? null,
    input.device ?? null,
    input.userAgent ?? null,
    input.screen ?? null,
    test.version,
    JSON.stringify(orders),
    startedAt,
  );
  return getAttempt(id)!;
}

export function getAttempt(id: string): Attempt | undefined {
  const r = getDb().prepare("SELECT * FROM attempts WHERE id = ?").get(id);
  return r ? rowToAttempt(r) : undefined;
}

export function getAnswers(attemptId: string): Answer[] {
  return getDb().prepare("SELECT * FROM answers WHERE attempt_id = ? ORDER BY position").all(attemptId) as unknown as Answer[];
}

export function saveAnswer(
  attemptId: string,
  itemId: string,
  chosen: number | null,
  timeMs: number | null,
  shownAt: string | null,
  answeredAt: string | null,
): Answer | undefined {
  const item = itemById(itemId);
  if (!item) throw new Error("Ítem inválido");
  const attempt = getAttempt(attemptId);
  if (!attempt) throw new Error("Intento inválido");
  if (attempt.status !== "in_progress") throw new Error("La prueba ya terminó");
  const test = testOf(attempt.grade);
  const position = test.ids.indexOf(itemId);
  if (position < 0) throw new Error("La misión no es de esta prueba");
  const isCorrect = chosen === null ? null : chosen === item.correct ? 1 : 0;
  getDb()
    .prepare(
      `INSERT INTO answers (attempt_id, item_id, position, chosen, is_correct, time_ms, shown_at, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(attempt_id, item_id) DO UPDATE SET chosen = excluded.chosen, is_correct = excluded.is_correct,
         time_ms = excluded.time_ms, shown_at = excluded.shown_at, answered_at = excluded.answered_at`,
    )
    .run(attemptId, itemId, position, chosen, isCorrect, timeMs, shownAt, answeredAt);
  return getDb().prepare("SELECT * FROM answers WHERE attempt_id = ? AND item_id = ?").get(attemptId, itemId) as unknown as Answer;
}

/** Cierra la prueba: puntaje con las misiones de su grado y tiempo total (sin límite). */
export function finishAttempt(attemptId: string): Attempt {
  const db = getDb();
  const attempt = getAttempt(attemptId);
  if (!attempt) throw new Error("Intento inválido");
  if (attempt.status !== "in_progress") return attempt;
  const answers = getAnswers(attemptId);
  const byId = new Map(answers.map((a) => [a.item_id, a]));
  let score = 0;
  let scoreA = 0;
  let scoreB = 0;
  for (const item of testOf(attempt.grade).items) {
    if (byId.get(item.id)?.is_correct === 1) {
      score++;
      if (item.part === "A") scoreA++;
      else scoreB++;
    }
  }
  const finishedAt = new Date().toISOString();
  const totalMs = Date.parse(finishedAt) - Date.parse(attempt.started_at);
  db.prepare("UPDATE attempts SET status = 'finished', finished_at = ?, total_ms = ?, score = ?, score_a = ?, score_b = ? WHERE id = ?").run(
    finishedAt,
    totalMs,
    score,
    scoreA,
    scoreB,
    attemptId,
  );
  return getAttempt(attemptId)!;
}

export function deleteAttempt(attemptId: string): void {
  getDb().prepare("DELETE FROM attempts WHERE id = ?").run(attemptId);
}

export type AttemptRow = Attempt & { school_name: string };

export function listAttempts(filter?: { schoolId?: number; grade?: Grade; status?: string }): AttemptRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.schoolId) {
    where.push("a.school_id = ?");
    params.push(filter.schoolId);
  }
  if (filter?.grade) {
    where.push("a.grade = ?");
    params.push(filter.grade);
  }
  if (filter?.status) {
    where.push("a.status = ?");
    params.push(filter.status);
  }
  const sql = `SELECT a.*, s.name AS school_name
    FROM attempts a JOIN schools s ON s.id = a.school_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.started_at DESC`;
  return (getDb().prepare(sql).all(...params) as Row[]).map((r) => ({ ...rowToAttempt(r), school_name: String(r.school_name) }));
}

export function listAllAnswers(attemptIds?: string[]): Answer[] {
  if (attemptIds && attemptIds.length === 0) return [];
  if (!attemptIds) return getDb().prepare("SELECT * FROM answers").all() as unknown as Answer[];
  const placeholders = attemptIds.map(() => "?").join(",");
  return getDb().prepare(`SELECT * FROM answers WHERE attempt_id IN (${placeholders})`).all(...attemptIds) as unknown as Answer[];
}
