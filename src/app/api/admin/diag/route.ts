import fs from "node:fs";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { dataDir, dbFile, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Diagnóstico de almacenamiento: dónde está la base y si la carpeta es un volumen montado.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  getDb();
  const dir = dataDir();
  const file = dbFile();
  let mounts: string[] = [];
  try {
    mounts = fs
      .readFileSync("/proc/self/mountinfo", "utf8")
      .split("\n")
      .filter((l) => l.includes(dir) || l.includes("/app"))
      .map((l) => l.split(" ").slice(3, 6).join(" ") + " … " + l.split(" - ")[1]?.slice(0, 80));
  } catch {
    /* no Linux */
  }
  const counts = getDb().prepare("SELECT (SELECT COUNT(*) FROM schools) AS schools, (SELECT COUNT(*) FROM attempts) AS attempts").get();
  return NextResponse.json({
    env_DATA_DIR: process.env.DATA_DIR ?? null,
    dataDir: dir,
    dbFile: file,
    exists: fs.existsSync(file),
    sizeBytes: fs.existsSync(file) ? fs.statSync(file).size : 0,
    files: fs.existsSync(dir) ? fs.readdirSync(dir) : [],
    cwd: process.cwd(),
    mounts,
    counts,
  });
}
