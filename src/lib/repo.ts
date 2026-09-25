// Operaciones sobre la base de datos (colegios, cursos, intentos, respuestas).
import { randomUUID } from "node:crypto";
import { getDb, type Row } from "./db";
import { ITEMS, TEST_VERSION, itemById } from "./items";

export type School = { id: number; name: string; courses: Course[] };
export type Course = { id: number; school_id: number; name: string };

export type Attempt = {
  id: string;
  school_id: number;
  course_id: number;
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

export const TIME_LIMIT_MS = 45 * 60 * 1000;

// ───────── Colegios y cursos ─────────

export function listSchools(): School[] {
  const db = getDb();
  const schools = db.prepare("SELECT id, name FROM schools ORDER BY name").all() as { id: number; name: string }[];
  const courses = db.prepare("SELECT id, school_id, name FROM courses ORDER BY name").all() as Course[];
  return schools.map((s) => ({ ...s, courses: courses.filter((c) => c.school_id === s.id) }));
}

export function createSchool(name: string): number {
  const r = getDb().prepare("INSERT INTO schools (name) VALUES (?)").run(name.trim());
  return Number(r.lastInsertRowid);
}

export function renameSchool(id: number, name: string): void {
  getDb().prepare("UPDATE schools SET name = ? WHERE id = ?").run(name.trim(), id);
}

export function deleteSchool(id: number): void {
  getDb().prepare("DELETE FROM schools WHERE id = ?").run(id);
}

export function createCourse(schoolId: number, name: string): number {
  const r = getDb().prepare("INSERT INTO courses (school_id, name) VALUES (?, ?)").run(schoolId, name.trim());
  return Number(r.lastInsertRowid);
}

export function deleteCourse(id: number): void {
  getDb().prepare("DELETE FROM courses WHERE id = ?").run(id);
}

export function countAttemptsBySchool(): Record<number, number> {
  const rows = getDb().prepare("SELECT school_id, COUNT(*) AS n FROM attempts GROUP BY school_id").all() as { school_id: number; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.school_id, r.n]));
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
  courseId: number;
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
  const course = db.prepare("SELECT id, school_id FROM courses WHERE id = ?").get(input.courseId) as Course | undefined;
  if (!course || course.school_id !== input.schoolId) throw new Error("Curso inválido");
  const id = randomUUID();
  const orders: Record<string, number[]> = {};
  for (const item of ITEMS) orders[item.id] = shuffle(item.options.map((_, i) => i));
  const startedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO attempts (id, school_id, course_id, student_name, age, prior_exp, gender, device, user_agent, screen, test_version, option_orders, started_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')`,
  ).run(
    id,
    input.schoolId,
    input.courseId,
    input.studentName.trim(),
    input.age ?? null,
    input.priorExp ?? null,
    input.gender ?? null,
    input.device ?? null,
    input.userAgent ?? null,
    input.screen ?? null,
    TEST_VERSION,
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
  const position = ITEMS.findIndex((i) => i.id === itemId);
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

export function finishAttempt(attemptId: string, reason: "finished" | "timed_out" = "finished"): Attempt {
  const db = getDb();
  const attempt = getAttempt(attemptId);
  if (!attempt) throw new Error("Intento inválido");
  if (attempt.status !== "in_progress") return attempt;
  const answers = getAnswers(attemptId);
  const byId = new Map(answers.map((a) => [a.item_id, a]));
  let score = 0;
  let scoreA = 0;
  let scoreB = 0;
  for (const item of ITEMS) {
    const a = byId.get(item.id);
    const ok = a?.is_correct === 1;
    if (ok) {
      score++;
      if (item.part === "A") scoreA++;
      else scoreB++;
    }
  }
  const finishedAt = new Date().toISOString();
  const totalMs = Date.parse(finishedAt) - Date.parse(attempt.started_at);
  db.prepare("UPDATE attempts SET status = ?, finished_at = ?, total_ms = ?, score = ?, score_a = ?, score_b = ? WHERE id = ?").run(
    reason,
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

export type AttemptRow = Attempt & { school_name: string; course_name: string };

export function listAttempts(filter?: { schoolId?: number; courseId?: number; status?: string }): AttemptRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.schoolId) {
    where.push("a.school_id = ?");
    params.push(filter.schoolId);
  }
  if (filter?.courseId) {
    where.push("a.course_id = ?");
    params.push(filter.courseId);
  }
  if (filter?.status) {
    where.push("a.status = ?");
    params.push(filter.status);
  }
  const sql = `SELECT a.*, s.name AS school_name, c.name AS course_name
    FROM attempts a JOIN schools s ON s.id = a.school_id JOIN courses c ON c.id = a.course_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.started_at DESC`;
  return (getDb().prepare(sql).all(...params) as Row[]).map((r) => ({ ...rowToAttempt(r), school_name: String(r.school_name), course_name: String(r.course_name) }));
}

export function listAllAnswers(attemptIds?: string[]): Answer[] {
  if (attemptIds && attemptIds.length === 0) return [];
  if (!attemptIds) return getDb().prepare("SELECT * FROM answers").all() as unknown as Answer[];
  const placeholders = attemptIds.map(() => "?").join(",");
  return getDb().prepare(`SELECT * FROM answers WHERE attempt_id IN (${placeholders})`).all(...attemptIds) as unknown as Answer[];
}
