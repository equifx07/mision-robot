// Modelo de datos de los ítems de Misión Robot (EPC-6).
// Coordenadas: [columna, fila], ambas desde 1, (1,1) arriba a la izquierda.

export type Dir = "U" | "D" | "L" | "R";
export type Cell = readonly [number, number];

export type Cond =
  | { kind: "rock"; dir: Dir } // hay roca en la casilla vecina
  | { kind: "path"; dir: Dir } // hay camino (y no hay roca) hacia esa dirección
  | { kind: "hole" }; // hueco a completar (ítems de completar)

export type Block =
  | { t: "move"; dir: Dir }
  | { t: "repeat"; n: number; body: Block[] }
  | { t: "until"; body: Block[] } // repetir hasta llegar a la base
  | { t: "while"; cond: Cond; body: Block[] } // mientras haya camino →
  | { t: "if"; cond: Cond; then: Block[]; else?: Block[] }
  | { t: "call"; name: string } // llamada a función
  | { t: "hole" }; // hueco a completar

export type FuncDef = { name: string; body: Block[] };
export type Program = { defs?: FuncDef[]; main: Block[] };

export type Edge = readonly [Cell, Cell];

export type MazeMap = {
  kind: "maze";
  cols: number;
  rows: number;
  start: Cell;
  base: Cell;
  rocks?: Cell[];
  gems?: Cell[];
  requireGems?: boolean;
  /** Si es true, existen todos los caminos entre casillas vecinas salvo los listados en `walls`. */
  allPaths?: boolean;
  /** Caminos explícitos (cuando allPaths es false). */
  paths?: Edge[];
  /** Caminos que se quitan (cuando allPaths es true). */
  walls?: Edge[];
};

export type CanvasMap = {
  kind: "canvas";
  cols: number;
  rows: number;
  start: Cell;
  /** Programa que dibuja la figura objetivo (se usa para calcular el rastro a mostrar). */
  target: Program;
};

export type GameMap = MazeMap | CanvasMap;

export type OptionA =
  | { kind: "program"; program: Program } // secuenciar / depurar: programa completo
  | { kind: "piece"; blocks: Block[] } // completar: bloques que llenan el hueco
  | { kind: "cond"; cond: Cond } // completar: condición que llena el hueco
  | { kind: "def"; name: string; body: Block[] } // funciones: definición que falta
  /** Arreglar: programa arreglado; `from` y `to` son el pedacito que cambia (solo para mostrar). */
  | { kind: "fix"; program: Program; from: Block[]; to: Block[] };

export type ConceptA =
  | "secuencias"
  | "repetir"
  | "hasta"
  | "anidados"
  | "si"
  | "si-sino"
  | "funciones";

export type TaskA = "S" | "C" | "D" | "E"; // secuenciar, completar, depurar, evaluar equivalencia

export type ItemA = {
  id: string;
  part: "A";
  block: "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7";
  concept: ConceptA;
  task: TaskA;
  prompt: string;
  map: GameMap;
  /** Programa dado: con huecos (C), con error (D), o programa principal cuya función falta (A7.1). */
  given?: Program;
  /** Texto corto sobre el programa dado (p. ej. "Este programa hace que el robot se choque"). */
  givenNote?: string;
  options: OptionA[];
  correct: number;
  notes?: string;
};

export type PracticeB =
  | "descomposicion"
  | "patrones"
  | "representacion"
  | "abstraccion"
  | "algoritmo"
  | "evaluar"
  | "logica";

export type ItemB = {
  id: string;
  part: "B";
  practice: PracticeB;
  /** Datos y reglas de la situación, en frases cortas (se muestran como lista). */
  facts?: string[];
  /** La pregunta. */
  prompt: string;
  /** Clave de la figura SVG que acompaña al ítem (ver components/b). */
  figure: string;
  /** Si está, las opciones se dibujan (ver OptionFigure); el texto de options queda para exportar y revisar. */
  optionFigure?: string;
  options: string[];
  correct: number;
  notes?: string;
};

export type Item = ItemA | ItemB;

export const DIR_ARROW: Record<Dir, string> = { U: "↑", D: "↓", L: "←", R: "→" };
export const DIR_NAME: Record<Dir, string> = {
  U: "arriba",
  D: "abajo",
  L: "izquierda",
  R: "derecha",
};

// Atajos para escribir ítems de forma compacta.
export const mv = (dir: Dir): Block => ({ t: "move", dir });
export const seq = (s: string): Block[] =>
  s
    .split("")
    .filter((ch) => "↑↓←→".includes(ch))
    .map((ch) => mv(ch === "↑" ? "U" : ch === "↓" ? "D" : ch === "←" ? "L" : "R"));
export const rep = (n: number, body: Block[]): Block => ({ t: "repeat", n, body });
export const until = (body: Block[]): Block => ({ t: "until", body });
export const whileP = (dir: Dir, body: Block[]): Block => ({
  t: "while",
  cond: { kind: "path", dir },
  body,
});
export const ifRock = (dir: Dir, then: Block[], els?: Block[]): Block => ({
  t: "if",
  cond: { kind: "rock", dir },
  then,
  else: els,
});
export const ifPath = (dir: Dir, then: Block[], els?: Block[]): Block => ({
  t: "if",
  cond: { kind: "path", dir },
  then,
  else: els,
});
export const ifHole = (then: Block[], els?: Block[]): Block => ({
  t: "if",
  cond: { kind: "hole" },
  then,
  else: els,
});
export const call = (name: string): Block => ({ t: "call", name });
export const HOLE: Block = { t: "hole" };
export const prog = (main: Block[], defs?: FuncDef[]): Program => (defs ? { defs, main } : { main });
export const optProg = (main: Block[], defs?: FuncDef[]): OptionA => ({
  kind: "program",
  program: prog(main, defs),
});
export const optPiece = (blocks: Block[]): OptionA => ({ kind: "piece", blocks });
export const optCond = (cond: Cond): OptionA => ({ kind: "cond", cond });
export const optDef = (name: string, body: Block[]): OptionA => ({ kind: "def", name, body });
/** Opción de arreglar: el programa arreglado y el cambio que se muestra ("cambiar `from` por `to`"). */
export const optFix = (main: Block[], from: Block[], to: Block[]): OptionA => ({ kind: "fix", program: prog(main), from, to });
export const rock = (dir: Dir): Cond => ({ kind: "rock", dir });
export const path = (dir: Dir): Cond => ({ kind: "path", dir });
export const c = (col: number, row: number): Cell => [col, row];
export const e = (a: Cell, b: Cell): Edge => [a, b];
