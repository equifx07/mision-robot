// Acceso a la base de datos SQLite (módulo nativo node:sqlite, Node >= 22.13).
// El archivo vive en DATA_DIR (por defecto ./data), que en producción es un volumen persistente.
import fs from "node:fs";
import path from "node:path";

type SqlValue = string | number | null;
type Row = Record<string, SqlValue>;

interface Statement {
  run(...params: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: SqlValue[]): Row | undefined;
  all(...params: SqlValue[]): Row[];
}
interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
}

const PRAGMAS = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
`;

/**
 * Esquema 2 (2026-10-07): dos pruebas (4.º y 6.º). El grado reemplaza al curso: ya no hay cursos.
 * Al pasar del esquema 1 al 2 se borran todas las pruebas anteriores (pedido del equipo: eran de prueba).
 */
const SCHEMA_VERSION = 2;
const SCHEMA = `
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  grade TEXT NOT NULL,
  student_name TEXT NOT NULL,
  age INTEGER,
  prior_exp TEXT,
  gender TEXT,
  device TEXT,
  user_agent TEXT,
  screen TEXT,
  test_version TEXT NOT NULL,
  option_orders TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  total_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  score INTEGER,
  score_a INTEGER,
  score_b INTEGER
);
CREATE INDEX IF NOT EXISTS attempts_school ON attempts(school_id);
CREATE INDEX IF NOT EXISTS attempts_grade ON attempts(grade);
CREATE INDEX IF NOT EXISTS attempts_status ON attempts(status);

CREATE TABLE IF NOT EXISTS answers (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  chosen INTEGER,
  is_correct INTEGER,
  time_ms INTEGER,
  shown_at TEXT,
  answered_at TEXT,
  PRIMARY KEY (attempt_id, item_id)
);
CREATE INDEX IF NOT EXISTS answers_item ON answers(item_id);
`;

declare global {
  // eslint-disable-next-line no-var
  var __misionRobotDb: Database | undefined;
}

/** Carpeta de datos: DATA_DIR (sin comillas ni espacios sobrantes) o ./data. */
export function dataDir(): string {
  const raw = (process.env.DATA_DIR ?? "").trim().replace(/^['"]+|['"]+$/g, "");
  return raw ? path.resolve(raw) : path.join(process.cwd(), "data");
}

export function dbFile(): string {
  return path.join(dataDir(), "mision-robot.db");
}

function open(): Database {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = dbFile();
  // Se carga por getBuiltinModule para que el bundler no intente resolver el módulo.
  const sqlite = process.getBuiltinModule("node:sqlite") as { DatabaseSync: new (p: string) => Database };
  const db = new sqlite.DatabaseSync(file);
  db.exec(PRAGMAS);
  const version = Number(db.prepare("PRAGMA user_version").get()?.user_version ?? 0);
  if (version < SCHEMA_VERSION) {
    // Migración al esquema 2: se descartan las pruebas y los cursos del esquema 1; los colegios quedan.
    db.exec("DROP TABLE IF EXISTS answers; DROP TABLE IF EXISTS attempts; DROP TABLE IF EXISTS courses;");
    db.exec(SCHEMA);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  } else db.exec(SCHEMA);
  return db;
}

export function getDb(): Database {
  if (!globalThis.__misionRobotDb) globalThis.__misionRobotDb = open();
  return globalThis.__misionRobotDb;
}

export type { Row, SqlValue };
