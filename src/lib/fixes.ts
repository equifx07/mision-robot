// Dónde actúa cada opción de arreglar: busca en el programa dado el pedacito `from` que la opción cambia
// y devuelve sus filas (en el mismo orden que flattenRows de ProgramView: definiciones primero).
import type { Block, Program } from "./model";

function rowsIn(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    if (b.t === "repeat" || b.t === "until" || b.t === "while") n += 1 + rowsIn(b.body);
    else if (b.t === "if") n += 1 + rowsIn(b.then) + (b.else ? 1 + rowsIn(b.else) : 0);
    else n += 1;
  }
  return n;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** ¿El bloque `f` de la opción es el bloque `g` del programa? Si `f` tiene el cuerpo vacío, se compara solo el encabezado. */
function matches(f: Block, g: Block): { ok: boolean; headOnly: boolean } {
  if (f.t !== g.t) return { ok: false, headOnly: false };
  switch (f.t) {
    case "move":
      return { ok: f.dir === (g as typeof f).dir, headOnly: false };
    case "call":
      return { ok: f.name === (g as typeof f).name, headOnly: false };
    case "hole":
      return { ok: true, headOnly: false };
    case "repeat":
    case "until":
    case "while": {
      const gg = g as typeof f;
      const head = f.t === "repeat" ? f.n === (gg as Extract<Block, { t: "repeat" }>).n : f.t === "while" ? same(f.cond, (gg as Extract<Block, { t: "while" }>).cond) : true;
      if (!head) return { ok: false, headOnly: false };
      if (f.body.length === 0) return { ok: true, headOnly: true };
      return { ok: same(f.body, gg.body), headOnly: false };
    }
    case "if": {
      const gg = g as typeof f;
      if (!same(f.cond, gg.cond)) return { ok: false, headOnly: false };
      if (f.then.length === 0 && !f.else?.length) return { ok: true, headOnly: true };
      return { ok: same(f.then, gg.then) && same(f.else ?? null, gg.else ?? null), headOnly: false };
    }
  }
}

/** Filas del programa que ocupa `from`, o null si no aparece. */
export function fixRows(given: Program, from: Block[]): number[] | null {
  let found: number[] | null = null;
  let row = 0;
  const walk = (blocks: Block[]) => {
    // ¿Empieza acá una coincidencia?
    const starts: number[] = [];
    let r = row;
    for (const b of blocks) {
      starts.push(r);
      r += rowsIn([b]);
    }
    for (let i = 0; !found && i + from.length <= blocks.length; i++) {
      const rows: number[] = [];
      let ok = true;
      for (let k = 0; k < from.length && ok; k++) {
        const g = blocks[i + k];
        const m = matches(from[k], g);
        if (!m.ok) ok = false;
        else if (m.headOnly) rows.push(starts[i + k]);
        else for (let x = 0; x < rowsIn([g]); x++) rows.push(starts[i + k] + x);
      }
      if (ok) found = rows;
    }
    // Si no, buscar adentro de cada bloque.
    for (const b of blocks) {
      if (found) return;
      row += 1;
      if (b.t === "repeat" || b.t === "until" || b.t === "while") walk(b.body);
      else if (b.t === "if") {
        walk(b.then);
        if (b.else) {
          row += 1;
          walk(b.else);
        }
      }
    }
  };
  for (const d of given.defs ?? []) {
    if (found) break;
    row += 1;
    walk(d.body);
  }
  if (!found) walk(given.main);
  return found;
}

/** "bloque 3", "bloques 2 y 3", "bloques 2 a 4". */
export function blocksLabel(numbers: number[]): string {
  const ns = [...new Set(numbers)].sort((a, b) => a - b);
  if (ns.length === 0) return "";
  if (ns.length === 1) return `bloque ${ns[0]}`;
  if (ns.length === 2) return `bloques ${ns[0]} y ${ns[1]}`;
  const contiguous = ns.every((n, i) => i === 0 || n === ns[i - 1] + 1);
  return contiguous ? `bloques ${ns[0]} a ${ns[ns.length - 1]}` : `bloques ${ns.slice(0, -1).join(", ")} y ${ns[ns.length - 1]}`;
}
