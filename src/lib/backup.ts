// Copias de seguridad de la base (SQLite) en la carpeta de datos: DATA_DIR/backups.
// - Una al arrancar la app y una por hora si hubo cambios (VACUUM INTO: copia consistente aunque haya escrituras).
// - Se guardan todas las de los últimos 7 días; de ahí a 90 días, la última de cada día; las más viejas se borran.
// - Desde el panel (Exportar) se puede bajar una copia nueva o cualquiera de las guardadas.
// Protegen contra errores del programa y borrados por error, no contra la pérdida del servidor:
// para eso hay que bajar copias y guardarlas en otro lado.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dataDir, whenOpened, type Database } from "./db";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const KEEP_ALL_DAYS = 7;
const KEEP_DAILY_DAYS = 90;
const NAME = /^mision-robot-(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})-([a-z]+)\.db$/;

export const backupDir = () => path.join(dataDir(), "backups");

/** "2026-10-12_14-05-33" (hora UTC). */
const stamp = (d = new Date()) => d.toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");

function vacuumInto(db: Database, file: string) {
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
}

export type BackupFile = { name: string; size: number; date: Date };

export function listBackups(): BackupFile[] {
  let names: string[] = [];
  try {
    names = fs.readdirSync(backupDir());
  } catch {
    return [];
  }
  return names
    .map((name) => {
      const m = NAME.exec(name);
      if (!m) return null;
      const date = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`);
      return { name, size: fs.statSync(path.join(backupDir(), name)).size, date };
    })
    .filter((x): x is BackupFile => x !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Borra copias viejas: deja todas las de 7 días y una por día hasta 90 días. */
function prune() {
  const now = Date.now();
  const seenDays = new Set<string>();
  for (const b of listBackups()) {
    const age = now - b.date.getTime();
    const day = b.date.toISOString().slice(0, 10);
    let keep = age <= KEEP_ALL_DAYS * DAY;
    if (!keep && age <= KEEP_DAILY_DAYS * DAY && !seenDays.has(day)) keep = true; // la más nueva de ese día
    seenDays.add(day);
    if (!keep) fs.rmSync(path.join(backupDir(), b.name), { force: true });
  }
}

export function backupNow(db: Database, reason: string): string {
  fs.mkdirSync(backupDir(), { recursive: true });
  const file = path.join(backupDir(), `mision-robot-${stamp()}-${reason}.db`);
  vacuumInto(db, file);
  prune();
  return file;
}

/** Copia nueva para descargar (en una carpeta temporal, no se suma a las guardadas). */
export function freshCopy(db: Database): string {
  const file = path.join(os.tmpdir(), `mision-robot-${stamp()}-${Math.random().toString(36).slice(2, 8)}.db`);
  vacuumInto(db, file);
  return file;
}

declare global {
  // eslint-disable-next-line no-var
  var __misionRobotBackupTimer: ReturnType<typeof setInterval> | undefined;
}

const totalChanges = (db: Database) => Number(db.prepare("SELECT total_changes() AS n").get()?.n ?? 0);

// Copias automáticas: al abrir la base y después cada hora si hubo cambios.
whenOpened((db) => {
  if (globalThis.__misionRobotBackupTimer) return;
  try {
    backupNow(db, "arranque");
  } catch (err) {
    console.error("No se pudo hacer la copia de seguridad al arrancar:", err);
  }
  let last = totalChanges(db);
  const timer = setInterval(() => {
    const now = totalChanges(db);
    if (now === last) return;
    try {
      backupNow(db, "hora");
      last = now;
    } catch (err) {
      console.error("No se pudo hacer la copia de seguridad por hora:", err);
    }
  }, HOUR);
  timer.unref?.();
  globalThis.__misionRobotBackupTimer = timer;
});
