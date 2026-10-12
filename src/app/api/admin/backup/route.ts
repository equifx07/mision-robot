import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { backupDir, freshCopy, listBackups } from "@/lib/backup";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Descarga de la base completa (SQLite). Sin parámetros: una copia hecha en este momento.
// ?archivo=<nombre>: una de las copias automáticas guardadas en el servidor.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const archivo = new URL(req.url).searchParams.get("archivo");
  let file: string;
  let name: string;
  let temp = false;
  if (archivo) {
    const found = listBackups().find((b) => b.name === archivo);
    if (!found) return NextResponse.json({ error: "No existe esa copia" }, { status: 404 });
    file = path.join(backupDir(), found.name);
    name = found.name;
  } else {
    file = freshCopy(getDb());
    name = `mision-robot-${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}.db`;
    temp = true;
  }
  const data = fs.readFileSync(file);
  if (temp) fs.rmSync(file, { force: true });
  return new NextResponse(data, {
    headers: {
      "content-type": "application/vnd.sqlite3",
      "content-disposition": `attachment; filename="${name}"`,
      "content-length": String(data.length),
    },
  });
}
