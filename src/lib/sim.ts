// Simulador del robot: ejecuta un programa sobre un mapa y devuelve el resultado.
// Reglas (ver docs/02-banco-de-items.md, sección 0):
//  - moverse sin camino, contra una roca o fuera del mapa = choque (falla)
//  - "repetir hasta llegar a la base": el robot se detiene apenas pisa la base
//  - "mientras haya camino a la derecha": se evalúa antes de cada vuelta
//  - la misión se cumple si al terminar el programa el robot está en la base
//    (y juntó todas las gemas cuando el mapa lo exige)
//  - en lienzo: el robot pinta el rastro; se cumple si el rastro coincide con la figura

import type {
  Block,
  CanvasMap,
  Cell,
  Cond,
  Dir,
  Edge,
  GameMap,
  ItemA,
  MazeMap,
  OptionA,
  Program,
} from "./model";

export type SimStatus =
  | "ok"
  | "crash" // se chocó (pared, roca o borde)
  | "off_base" // terminó fuera de la base
  | "gems_missing" // no juntó todas las gemas
  | "wrong_figure" // lienzo: la figura no coincide
  | "timeout" // nunca termina
  | "incomplete" // programa con huecos
  | "no_def"; // llama a una función que no existe

export type Seg = string; // "c1,r1-c2,r2" normalizado (menor primero)

export type SimResult = {
  ok: boolean;
  status: SimStatus;
  pos: Cell;
  steps: Cell[]; // posiciones visitadas, empezando por el inicio
  /** Índice de fila (ver flattenRows en ProgramView) del bloque que produjo cada movimiento. */
  trace: number[];
  trail: Set<Seg>;
  gems: number;
  crashAt?: { from: Cell; dir: Dir; reason: "wall" | "rock" | "edge" };
  detail: string;
};

/** Asigna a cada bloque su índice de fila, en el mismo orden que flattenRows. */
export function indexBlocks(program: Program): Map<Block, number> {
  const idx = new Map<Block, number>();
  let i = 0;
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      idx.set(b, i++);
      if (b.t === "repeat" || b.t === "until" || b.t === "while") walk(b.body);
      else if (b.t === "if") {
        walk(b.then);
        if (b.else) {
          i++; // fila "si no"
          walk(b.else);
        }
      }
    }
  };
  for (const d of program.defs ?? []) {
    i++; // fila "definir"
    walk(d.body);
  }
  walk(program.main);
  return idx;
}

const DELTA: Record<Dir, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const MAX_STEPS = 400;

export function edgeKey(a: Cell, b: Cell): Seg {
  const [c1, r1] = a;
  const [c2, r2] = b;
  const first = c1 < c2 || (c1 === c2 && r1 < r2);
  return first ? `${c1},${r1}-${c2},${r2}` : `${c2},${r2}-${c1},${r1}`;
}

function cellKey(cell: Cell): string {
  return `${cell[0]},${cell[1]}`;
}

function neighbors(map: GameMap, cell: Cell): Cell[] {
  const out: Cell[] = [];
  for (const d of ["U", "D", "L", "R"] as Dir[]) {
    const [dc, dr] = DELTA[d];
    const n: Cell = [cell[0] + dc, cell[1] + dr];
    if (n[0] >= 1 && n[0] <= map.cols && n[1] >= 1 && n[1] <= map.rows) out.push(n);
  }
  return out;
}

/** Conjunto de caminos (aristas) de un mapa. En lienzo, todas las vecindades. */
export function mapEdges(map: GameMap): Set<Seg> {
  const edges = new Set<Seg>();
  if (map.kind === "canvas" || map.allPaths) {
    for (let col = 1; col <= map.cols; col++) {
      for (let row = 1; row <= map.rows; row++) {
        for (const n of neighbors(map, [col, row])) edges.add(edgeKey([col, row], n));
      }
    }
    if (map.kind === "maze" && map.walls) {
      for (const [a, b] of map.walls) edges.delete(edgeKey(a, b));
    }
  } else if (map.kind === "maze" && map.paths) {
    for (const [a, b] of map.paths) edges.add(edgeKey(a, b));
  }
  return edges;
}

class World {
  edges: Set<Seg>;
  rocks: Set<string>;
  gemsLeft: Set<string>;
  pos: Cell;
  steps: Cell[] = [];
  trace: number[] = [];
  trail = new Set<Seg>();
  moves = 0;
  crashAt?: SimResult["crashAt"];
  rowIndex = new Map<Block, number>();

  constructor(public map: GameMap) {
    this.edges = mapEdges(map);
    this.rocks = new Set(map.kind === "maze" ? (map.rocks ?? []).map(cellKey) : []);
    this.gemsLeft = new Set(map.kind === "maze" ? (map.gems ?? []).map(cellKey) : []);
    this.pos = map.start;
    this.steps.push(map.start);
  }

  inBounds(cell: Cell): boolean {
    return cell[0] >= 1 && cell[0] <= this.map.cols && cell[1] >= 1 && cell[1] <= this.map.rows;
  }

  target(dir: Dir): Cell {
    const [dc, dr] = DELTA[dir];
    return [this.pos[0] + dc, this.pos[1] + dr];
  }

  canMove(dir: Dir): "ok" | "edge" | "wall" | "rock" {
    const t = this.target(dir);
    if (!this.inBounds(t)) return "edge";
    if (!this.edges.has(edgeKey(this.pos, t))) return "wall";
    if (this.rocks.has(cellKey(t))) return "rock";
    return "ok";
  }

  eval(cond: Cond): boolean {
    if (cond.kind === "hole") throw new SimError("incomplete");
    const t = this.target(cond.dir);
    if (cond.kind === "rock") return this.inBounds(t) && this.rocks.has(cellKey(t));
    return this.canMove(cond.dir) === "ok";
  }

  atBase(): boolean {
    return this.map.kind === "maze" && cellKey(this.pos) === cellKey(this.map.base);
  }

  move(dir: Dir, block?: Block): void {
    const why = this.canMove(dir);
    this.trace.push(block ? (this.rowIndex.get(block) ?? -1) : -1);
    if (why !== "ok") {
      this.crashAt = { from: this.pos, dir, reason: why };
      throw new SimError("crash");
    }
    const t = this.target(dir);
    this.trail.add(edgeKey(this.pos, t));
    this.pos = t;
    this.steps.push(t);
    this.gemsLeft.delete(cellKey(t));
    this.moves++;
    if (this.moves > MAX_STEPS) throw new SimError("timeout");
  }
}

class SimError extends Error {
  constructor(public status: SimStatus) {
    super(status);
  }
}

class ReachedBase extends Error {}

function run(blocks: Block[], w: World, defs: Map<string, Block[]>, insideUntil: number): void {
  for (const b of blocks) {
    switch (b.t) {
      case "move":
        w.move(b.dir, b);
        if (insideUntil > 0 && w.atBase()) throw new ReachedBase();
        break;
      case "repeat":
        for (let i = 0; i < b.n; i++) run(b.body, w, defs, insideUntil);
        break;
      case "until": {
        let guard = 0;
        try {
          // Si ya está en la base al empezar, no hace nada.
          if (w.atBase()) break;
          for (;;) {
            run(b.body, w, defs, insideUntil + 1);
            if (w.atBase()) break;
            if (++guard > MAX_STEPS) throw new SimError("timeout");
          }
        } catch (err) {
          if (!(err instanceof ReachedBase)) throw err;
        }
        break;
      }
      case "while": {
        let guard = 0;
        while (w.eval(b.cond)) {
          run(b.body, w, defs, insideUntil);
          if (++guard > MAX_STEPS) throw new SimError("timeout");
        }
        break;
      }
      case "if":
        if (w.eval(b.cond)) run(b.then, w, defs, insideUntil);
        else if (b.else) run(b.else, w, defs, insideUntil);
        break;
      case "call": {
        const body = defs.get(b.name);
        if (!body) throw new SimError("no_def");
        run(body, w, defs, insideUntil);
        break;
      }
      case "hole":
        throw new SimError("incomplete");
    }
  }
}

export function targetTrail(map: CanvasMap): Set<Seg> {
  const w = new World(map);
  const defs = new Map((map.target.defs ?? []).map((d) => [d.name, d.body]));
  run(map.target.main, w, defs, 0);
  return w.trail;
}

export function simulate(map: GameMap, program: Program): SimResult {
  const w = new World(map);
  w.rowIndex = indexBlocks(program);
  const defs = new Map((program.defs ?? []).map((d) => [d.name, d.body]));
  let status: SimStatus = "ok";
  try {
    run(program.main, w, defs, 0);
  } catch (err) {
    if (err instanceof SimError) status = err.status;
    else if (err instanceof ReachedBase) status = "ok";
    else throw err;
  }
  let detail = "";
  if (status === "ok") {
    if (map.kind === "maze") {
      if (!w.atBase()) {
        status = "off_base";
        detail = `termina en (${w.pos[0]},${w.pos[1]}), fuera de la base`;
      } else if (map.requireGems && w.gemsLeft.size > 0) {
        status = "gems_missing";
        detail = `le faltan ${w.gemsLeft.size} gema(s)`;
      } else {
        detail = `llega a la base en ${w.moves} movimientos`;
      }
    } else {
      const want = targetTrail(map);
      const same = want.size === w.trail.size && [...want].every((s) => w.trail.has(s));
      if (!same) {
        status = "wrong_figure";
        detail = "dibuja otra figura";
      } else detail = `dibuja la figura (${w.moves} movimientos)`;
    }
  } else if (status === "crash" && w.crashAt) {
    const r = w.crashAt.reason;
    const why = r === "edge" ? "se cae del mapa" : r === "rock" ? "choca con una roca" : "no hay puente";
    detail = `${why} al ir ${DIRWORD[w.crashAt.dir]} desde (${w.crashAt.from[0]},${w.crashAt.from[1]}) tras ${w.moves} movimientos`;
  } else if (status === "timeout") detail = "nunca termina";
  else if (status === "incomplete") detail = "programa incompleto";
  else if (status === "no_def") detail = "usa una función que no existe";

  return {
    ok: status === "ok",
    status,
    pos: w.pos,
    steps: w.steps,
    trace: w.trace,
    trail: w.trail,
    gems: (map.kind === "maze" ? (map.gems ?? []).length : 0) - w.gemsLeft.size,
    crashAt: w.crashAt,
    detail,
  };
}

const DIRWORD: Record<Dir, string> = { U: "↑", D: "↓", L: "←", R: "→" };

/** Reemplaza el primer hueco (de bloques o de condición) del programa. */
export function fillHole(program: Program, opt: OptionA): Program {
  if (opt.kind === "program" || opt.kind === "fix") return opt.program;
  if (opt.kind === "def") {
    const defs = [...(program.defs ?? []).filter((d) => d.name !== opt.name), { name: opt.name, body: opt.body }];
    return { defs, main: program.main };
  }
  let done = false;
  const fillBlocks = (blocks: Block[]): Block[] => {
    const out: Block[] = [];
    for (const b of blocks) {
      if (done) {
        out.push(b);
        continue;
      }
      if (b.t === "hole" && opt.kind === "piece") {
        out.push(...opt.blocks);
        done = true;
        continue;
      }
      if (b.t === "repeat") out.push({ ...b, body: fillBlocks(b.body) });
      else if (b.t === "until") out.push({ ...b, body: fillBlocks(b.body) });
      else if (b.t === "while") {
        const cond = b.cond.kind === "hole" && opt.kind === "cond" && !done ? ((done = true), opt.cond) : b.cond;
        out.push({ ...b, cond, body: fillBlocks(b.body) });
      } else if (b.t === "if") {
        const cond = b.cond.kind === "hole" && opt.kind === "cond" && !done ? ((done = true), opt.cond) : b.cond;
        out.push({ ...b, cond, then: fillBlocks(b.then), else: b.else ? fillBlocks(b.else) : undefined });
      } else out.push(b);
    }
    return out;
  };
  const defs = program.defs?.map((d) => ({ name: d.name, body: fillBlocks(d.body) }));
  const main = fillBlocks(program.main);
  return { defs, main };
}

/** Programa efectivo que resulta de elegir una opción en un ítem. */
export function effectiveProgram(item: ItemA, opt: OptionA): Program {
  if (opt.kind === "program" || opt.kind === "fix") {
    // Si el ítem tiene definiciones dadas (p. ej. A7.3), las opciones las heredan salvo que traigan las suyas.
    if (!opt.program.defs && item.given?.defs) return { defs: item.given.defs, main: opt.program.main };
    return opt.program;
  }
  if (!item.given) throw new Error(`El ítem ${item.id} necesita un programa dado para la opción ${opt.kind}`);
  return fillHole(item.given, opt);
}

export function simulateOption(item: ItemA, opt: OptionA): SimResult {
  return simulate(item.map, effectiveProgram(item, opt));
}

export function edgesOf(map: MazeMap): Edge[] {
  return [...mapEdges(map)].map((s) => {
    const [a, b] = s.split("-");
    const [c1, r1] = a.split(",").map(Number);
    const [c2, r2] = b.split(",").map(Number);
    return [[c1, r1], [c2, r2]] as Edge;
  });
}
