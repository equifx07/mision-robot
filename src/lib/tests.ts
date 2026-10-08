// Las dos pruebas: 4.º y 6.º grado. Cada una toma misiones del banco (items-a / items-b) en el orden
// del banco. La selección la hizo el equipo misión por misión el 2026-10-07
// (https://claude.ai/artifact/1ydhSLJ9hvmK8xas1tSuiy). A7.3 quedó fuera de las dos.
import { ITEMS } from "./items";
import type { Item } from "./model";

export type Grade = "4" | "6";
export const GRADES: Grade[] = ["4", "6"];
export const GRADE_LABEL: Record<Grade, string> = { "4": "4.º grado", "6": "6.º grado" };
export const isGrade = (g: unknown): g is Grade => g === "4" || g === "6";

const SELECTION: Record<Grade, string[]> = {
  "4": ["A1.1", "A1.2", "A2.1", "A2.2", "A2.3", "A3.1", "A3.2", "A3.3", "A4.1", "A4.2", "A4.3", "A5.1", "A5.2", "A6.1", "A6.3", "A7.1", "B2", "B4", "B5", "B7", "B8"],
  "6": ["A2.1", "A2.2", "A2.3", "A3.1", "A3.2", "A3.3", "A4.1", "A4.2", "A4.3", "A5.1", "A5.2", "A5.3", "A6.1", "A6.2", "A6.3", "A7.1", "A7.2", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"],
};

/** Versión de cada prueba: se guarda en cada intento. v1.0 = primera versión con dos pruebas. */
const VERSION: Record<Grade, string> = { "4": "epc4-v1.0", "6": "epc6-v1.0" };

export type Level = { key: string; name: string; min: number; max: number };

/**
 * Niveles de desempeño (provisorios, a recalibrar con el piloto). Son los mismos cortes que se usaban
 * con 28 misiones (0–9, 10–16, 17–22, 23–28), llevados en proporción a la cantidad de misiones de cada prueba.
 */
function levelsFor(max: number): Level[] {
  const cut = (k: number) => Math.round((k / 28) * max);
  const a = cut(10);
  const b = cut(17);
  const c = cut(23);
  return [
    { key: "inicial", name: "Inicial", min: 0, max: a - 1 },
    { key: "desarrollo", name: "En desarrollo", min: a, max: b - 1 },
    { key: "logrado", name: "Logrado", min: b, max: c - 1 },
    { key: "avanzado", name: "Avanzado", min: c, max },
  ];
}

export type TestDef = {
  grade: Grade;
  label: string;
  version: string;
  items: Item[];
  ids: string[];
  max: number;
  partA: number;
  partB: number;
  levels: Level[];
};

function build(grade: Grade): TestDef {
  const ids = SELECTION[grade];
  const items = ITEMS.filter((it) => ids.includes(it.id));
  if (items.length !== ids.length) throw new Error(`Prueba de ${grade}.º: hay misiones que no existen en el banco`);
  return {
    grade,
    label: GRADE_LABEL[grade],
    version: VERSION[grade],
    items,
    ids: items.map((it) => it.id),
    max: items.length,
    partA: items.filter((it) => it.part === "A").length,
    partB: items.filter((it) => it.part === "B").length,
    levels: levelsFor(items.length),
  };
}

/** "Inicial 0–7, En desarrollo 8–12, Logrado 13–16 y Avanzado 17–21". */
export function levelsText(test: TestDef): string {
  const parts = test.levels.map((l) => `${l.name} ${l.min}–${l.max}`);
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

export const TESTS: Record<Grade, TestDef> = { "4": build("4"), "6": build("6") };

export function testOf(grade: Grade | string | null | undefined): TestDef {
  return TESTS[isGrade(grade) ? grade : "6"];
}
