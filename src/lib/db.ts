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

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
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

function open(): Database {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "mision-robot.db");
  // Se carga por getBuiltinModule para que el bundler no intente resolver el módulo.
  const sqlite = process.getBuiltinModule("node:sqlite") as { DatabaseSync: new (p: string) => Database };
  const db = new sqlite.DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database {
  if (!globalThis.__misionRobotDb) globalThis.__misionRobotDb = open();
  return globalThis.__misionRobotDb;
}

export type { Row, SqlValue };
