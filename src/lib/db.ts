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
 * Historia del esquema:
 * - 2 (2026-10-07): dos pruebas (4.º y 6.º); el grado reemplaza al curso.
 * - 3 (2026-10-12): papelera. Colegios y pruebas borrados desde el panel quedan con deleted_at y se
 *   pueden recuperar.
 *
 * REGLA (los datos no se pueden perder): un cambio de esquema SOLO puede AGREGAR tablas o columnas.
 * Nunca DROP TABLE, nunca DELETE masivo, nunca recrear tablas. Antes de cualquier cambio se hace una
 * copia de seguridad (ver backup.ts).
 */
const SCHEMA_VERSION = 3;
const SCHEMA = `
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
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
  score_b INTEGER,
  deleted_at TEXT
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
  db.exec(SCHEMA); // solo crea lo que falta (IF NOT EXISTS)
  const columns = (table: string) => db.prepare(`PRAGMA table_info(${table})`).all().map((r) => String(r.name));
  // Una base anterior al esquema 2 no se toca: se avisa en vez de borrar nada.
  if (!columns("attempts").includes("grade")) throw new Error("La base de datos es de una versión anterior (sin grado). No se modifica: revisar a mano.");
  // Esquema 3: columnas de la papelera (solo se agregan). Antes de tocar nada, una copia.
  const missing = ["schools", "attempts"].filter((t) => !columns(t).includes("deleted_at"));
  if (missing.length) {
    const backups = path.join(dir, "backups");
    fs.mkdirSync(backups, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
    db.exec(`VACUUM INTO '${path.join(backups, `mision-robot-${stamp}-migracion.db`).replace(/'/g, "''")}'`);
    for (const table of missing) db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
  }
  const version = Number(db.prepare("PRAGMA user_version").get()?.user_version ?? 0);
  if (version < SCHEMA_VERSION) db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  return db;
}

export function getDb(): Database {
  if (!globalThis.__misionRobotDb) {
    globalThis.__misionRobotDb = open();
    onOpen?.(globalThis.__misionRobotDb);
  }
  return globalThis.__misionRobotDb;
}

/** Se llama una vez al abrir la base (lo usa backup.ts para las copias automáticas). */
let onOpen: ((db: Database) => void) | undefined;
export function whenOpened(fn: (db: Database) => void): void {
  onOpen = fn;
  if (globalThis.__misionRobotDb) fn(globalThis.__misionRobotDb);
}

export type { Database };

export type { Row, SqlValue };
