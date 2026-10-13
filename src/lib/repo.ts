// Operaciones sobre la base de datos (colegios, intentos, respuestas).
// Hay dos pruebas (4.º y 6.º): cada intento guarda su grado y se corrige con las misiones de esa prueba.
// PAPELERA: desde el panel nunca se borra de verdad. Borrar marca deleted_at y esconde el colegio o la
// prueba de todas las listas y estadísticas; se puede restaurar desde la papelera.
import { randomUUID } from "node:crypto";
import { getDb, type Row } from "./db";
import "./backup"; // activa las copias de seguridad automáticas
import { parseDivisions } from "./divisions";
import { itemById } from "./items";
import { testOf, type Grade } from "./tests";

/** divisions: cursos del colegio (los mismos para 4.º y 6.º); vacío = sin cursos. */
export type School = { id: number; name: string; divisions: string[] };

export type Attempt = {
  id: string;
  school_id: number;
  grade: Grade;
  /** Curso dentro del grado ("S" para 6.º S); null = sin curso. */
  division: string | null;
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
  /** En la papelera desde esta fecha (null = activa). */
  deleted_at: string | null;
  /** Última señal de la pestaña abierta (cada 20 s mientras la prueba está en pantalla). */
  last_seen_at: string | null;
  /** Por dónde iba en esa señal: "Misión 7", "Explicación inicial"… */
  live_where: string | null;
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
  return (getDb().prepare("SELECT id, name, divisions FROM schools WHERE deleted_at IS NULL ORDER BY name").all() as Row[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    divisions: parseDivisions(r.divisions as string | null),
  }));
}

/** Crea el colegio. Si había uno con ese nombre en la papelera, lo restaura (con sus pruebas). */
export function createSchool(name: string, divisions: string[] = []): number {
  const db = getDb();
  const old = db.prepare("SELECT id FROM schools WHERE name = ? AND deleted_at IS NOT NULL").get(name.trim()) as { id: number } | undefined;
  if (old) {
    db.prepare("UPDATE schools SET deleted_at = NULL WHERE id = ?").run(old.id);
    if (divisions.length) setSchoolDivisions(old.id, divisions);
    return old.id;
  }
  const r = db.prepare("INSERT INTO schools (name, divisions) VALUES (?, ?)").run(name.trim(), divisions.length ? divisions.join(",") : null);
  return Number(r.lastInsertRowid);
}

/** Cambia la lista de cursos. Las pruebas ya hechas conservan su curso. */
export function setSchoolDivisions(id: number, divisions: string[]): void {
  getDb().prepare("UPDATE schools SET divisions = ? WHERE id = ?").run(divisions.length ? divisions.join(",") : null, id);
}

export function renameSchool(id: number, name: string): void {
  getDb().prepare("UPDATE schools SET name = ? WHERE id = ?").run(name.trim(), id);
}

/** Manda el colegio a la papelera: deja de verse, con todas sus pruebas. No borra nada. */
export function deleteSchool(id: number): void {
  getDb().prepare("UPDATE schools SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL").run(new Date().toISOString(), id);
}

export function restoreSchool(id: number): void {
  getDb().prepare("UPDATE schools SET deleted_at = NULL WHERE id = ?").run(id);
}

/** Pruebas activas por colegio y grado: { [schoolId]: { "4": n, "6": n } }. */
export function countAttemptsBySchool(): Record<number, Record<string, number>> {
  const rows = getDb().prepare("SELECT school_id, grade, COUNT(*) AS n FROM attempts WHERE deleted_at IS NULL GROUP BY school_id, grade").all() as { school_id: number; grade: string; n: number }[];
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
  division?: string | null;
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
  const school = db.prepare("SELECT id, divisions FROM schools WHERE id = ? AND deleted_at IS NULL").get(input.schoolId);
  if (!school) throw new Error("Colegio inválido");
  const divisions = parseDivisions(school.divisions as string | null);
  const division = input.division ? String(input.division).trim().toUpperCase() : null;
  if (divisions.length && !division) throw new Error("Elegí tu curso");
  if (division && !divisions.includes(division)) throw new Error("Curso inválido");
  const test = testOf(input.grade);
  const id = randomUUID();
  const orders: Record<string, number[]> = {};
  for (const item of test.items) orders[item.id] = shuffle(item.options.map((_, i) => i));
  const startedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO attempts (id, school_id, grade, division, student_name, age, prior_exp, gender, device, user_agent, screen, test_version, option_orders, started_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')`,
  ).run(
    id,
    input.schoolId,
    test.grade,
    division,
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
  if (attempt.deleted_at) throw new Error("La prueba fue borrada");
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

/**
 * Señal de vida de la prueba abierta: guarda la hora y por dónde va. Devuelve el estado para que la
 * pantalla del chico se entere si la terminaron o la descartaron desde el panel.
 */
export function touchAttempt(attemptId: string, where: string | null): "in_progress" | "finished" | "cancelled" | null {
  const attempt = getAttempt(attemptId);
  if (!attempt) return null;
  if (attempt.deleted_at) return "cancelled";
  if (attempt.status !== "in_progress") return "finished";
  getDb().prepare("UPDATE attempts SET last_seen_at = ?, live_where = ? WHERE id = ?").run(new Date().toISOString(), where, attemptId);
  return "in_progress";
}

export type LiveRow = {
  id: string;
  student_name: string;
  school_name: string;
  grade: Grade;
  division: string | null;
  started_at: string;
  last_seen_at: string | null;
  live_where: string | null;
  answered: number;
  last_answer: string | null;
};

/** Pruebas sin terminar (fuera de la papelera), con cuántas misiones contestaron y su última actividad. */
export function listLive(): LiveRow[] {
  return getDb()
    .prepare(
      `SELECT a.id, a.student_name, s.name AS school_name, a.grade, a.division, a.started_at, a.last_seen_at, a.live_where,
         (SELECT COUNT(*) FROM answers x WHERE x.attempt_id = a.id AND x.chosen IS NOT NULL) AS answered,
         (SELECT MAX(x.answered_at) FROM answers x WHERE x.attempt_id = a.id) AS last_answer
       FROM attempts a JOIN schools s ON s.id = a.school_id
       WHERE a.status = 'in_progress' AND a.deleted_at IS NULL AND s.deleted_at IS NULL
       ORDER BY s.name, a.grade, a.division, a.student_name`,
    )
    .all() as unknown as LiveRow[];
}

/** Último momento en que se supo algo de la prueba: señal de la pestaña, última respuesta o inicio. */
export function lastActivity(r: { started_at: string; last_seen_at: string | null; last_answer: string | null }): number {
  return Math.max(Date.parse(r.started_at), r.last_seen_at ? Date.parse(r.last_seen_at) : 0, r.last_answer ? Date.parse(r.last_answer) : 0);
}

/**
 * Cierra la prueba: puntaje con las misiones de su grado y tiempo total (sin límite).
 * endAt: cuándo termina (si la corta el panel, en su última actividad y no en el momento del clic).
 */
export function finishAttempt(attemptId: string, endAt?: Date): Attempt {
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
  const finishedAt = (endAt ?? new Date()).toISOString();
  const totalMs = Math.max(0, Date.parse(finishedAt) - Date.parse(attempt.started_at));
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

/** Corrige el curso de una prueba (por si el chico eligió mal). null = sin curso. */
export function setAttemptDivision(attemptId: string, division: string | null): void {
  getDb().prepare("UPDATE attempts SET division = ? WHERE id = ?").run(division ? division.trim().toUpperCase() : null, attemptId);
}

/** Manda la prueba a la papelera. No borra nada. */
export function deleteAttempt(attemptId: string): void {
  getDb().prepare("UPDATE attempts SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL").run(new Date().toISOString(), attemptId);
}

export function restoreAttempt(attemptId: string): void {
  getDb().prepare("UPDATE attempts SET deleted_at = NULL WHERE id = ?").run(attemptId);
}

/** Lo que está en la papelera: colegios y pruebas (con su colegio). */
export function listTrash(): { schools: (School & { deleted_at: string; attempts: number })[]; attempts: (AttemptRow & { school_deleted: boolean })[] } {
  const db = getDb();
  const schools = db
    .prepare("SELECT s.id, s.name, s.deleted_at, (SELECT COUNT(*) FROM attempts a WHERE a.school_id = s.id AND a.deleted_at IS NULL) AS attempts FROM schools s WHERE s.deleted_at IS NOT NULL ORDER BY s.deleted_at DESC")
    .all() as unknown as (School & { deleted_at: string; attempts: number })[];
  const attempts = (db
    .prepare("SELECT a.*, s.name AS school_name, s.deleted_at IS NOT NULL AS school_deleted FROM attempts a JOIN schools s ON s.id = a.school_id WHERE a.deleted_at IS NOT NULL ORDER BY a.deleted_at DESC")
    .all() as Row[]).map((r) => ({ ...rowToAttempt(r), school_name: String(r.school_name), school_deleted: Number(r.school_deleted) === 1 }));
  return { schools, attempts };
}

export type AttemptRow = Attempt & { school_name: string };

/** Pruebas activas (fuera de la papelera, y de colegios activos). */
export function listAttempts(filter?: { schoolId?: number; grade?: Grade; status?: string; division?: string }): AttemptRow[] {
  const where: string[] = ["a.deleted_at IS NULL", "s.deleted_at IS NULL"];
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
  if (filter?.division) {
    where.push("a.division = ?");
    params.push(filter.division);
  }
  const sql = `SELECT a.*, s.name AS school_name
    FROM attempts a JOIN schools s ON s.id = a.school_id
    WHERE ${where.join(" AND ")} ORDER BY a.started_at DESC`;
  return (getDb().prepare(sql).all(...params) as Row[]).map((r) => ({ ...rowToAttempt(r), school_name: String(r.school_name) }));
}

export function listAllAnswers(attemptIds?: string[]): Answer[] {
  if (attemptIds && attemptIds.length === 0) return [];
  if (!attemptIds) return getDb().prepare("SELECT * FROM answers").all() as unknown as Answer[];
  const placeholders = attemptIds.map(() => "?").join(",");
  return getDb().prepare(`SELECT * FROM answers WHERE attempt_id IN (${placeholders})`).all(...attemptIds) as unknown as Answer[];
}
