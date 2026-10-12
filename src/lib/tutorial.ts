// Contenido del tutorial inicial y de las prácticas (no puntúan). Se muestra en la ventana
// emergente violeta (components/Tutorial.tsx): el robot guía dice el título y las líneas.
// REGLA (pedido del equipo, 2026-10-08): los chicos no leen textos largos. Cada pantalla tiene un
// título corto y como mucho UNA frase corta; lo demás lo muestra el robot moviéndose.
// Hay dos clases de práctica: las de bloques nuevos (el robot hace una demostración) y las de
// formato de misión (pintar, completar, arreglar), donde el chico prueba una misión chiquita
// con el botón "Probar" antes de encontrarse con ese formato en la prueba.
import {
  c,
  call,
  e,
  HOLE,
  ifPath,
  ifRock,
  optFix,
  optPiece,
  optProg,
  prog,
  rep,
  seq,
  until,
  whileP,
  type Block,
  type GameMap,
  type ItemA,
  type Program,
} from "./model";

export type Demo = {
  map: GameMap;
  program: Program;
  /** Texto que se muestra al terminar la animación (si no, se usa el resultado de la misión). */
  outcome?: string;
  /** Nombre de la pestaña cuando hay varios ejemplos (dos o tres palabras). */
  label?: string;
};

/** Tarjeta de "Así va a ser la prueba". */
export type Fact = { badge: string; title: string; text?: string };

export type TutorialStep = {
  title: string;
  lines: string[];
  demo?: Demo;
  /** Varios ejemplos (se eligen con pestañas). */
  demos?: Demo[];
  /** Misión de práctica con botón "Probar". */
  tryIt?: ItemA;
  /** Tarjetas con datos de la prueba. */
  facts?: Fact[];
};

/** Lo que dice el robot cuando, después de una demostración, le toca probar al chico. */
export const TRY_AFTER_DEMO = {
  title: "¡Probá vos!",
  lines: ["Tocá una opción y apretá Probar."],
};

/** Misión de práctica (mismo formato que las de la prueba). */
function practice(p: Pick<ItemA, "id" | "task" | "prompt" | "map" | "options"> & Partial<ItemA>): ItemA {
  return { part: "A", block: "A1", concept: "secuencias", correct: 0, ...p };
}

const INTRO_MAP: GameMap = {
  kind: "maze",
  cols: 4,
  rows: 3,
  start: c(1, 1),
  base: c(3, 2),
  rocks: [c(4, 1)],
  paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(2, 2)), e(c(2, 2), c(3, 2)), e(c(3, 2), c(4, 2)), e(c(3, 1), c(3, 2)), e(c(1, 2), c(1, 3)), e(c(1, 3), c(2, 3)), e(c(2, 3), c(3, 3))],
};

export const INTRO: TutorialStep[] = [
  {
    title: "¡Llevame a la bandera!",
    lines: ["Cruzo por los puentes, de arriba hacia abajo."],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→")) },
  },
  {
    title: "Así pierdo",
    lines: ["Si no hay puente me choco. Si me paso, también pierdo."],
    demos: [
      { map: INTRO_MAP, program: prog(seq("→→")), label: "Me choco" },
      { map: INTRO_MAP, program: prog(seq("→↓→→")), label: "Me paso" },
    ],
  },
  {
    title: "¡Probá vos!",
    lines: ["Tocá un programa y apretá Probar."],
    tryIt: practice({
      id: "P-elegir",
      task: "S",
      prompt: "¿Qué programa lleva al robot hasta la base?",
      map: {
        kind: "maze",
        cols: 3,
        rows: 3,
        start: c(1, 1),
        base: c(3, 3),
        paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(2, 2)), e(c(2, 2), c(2, 3)), e(c(2, 3), c(3, 3)), e(c(1, 1), c(1, 2)), e(c(2, 1), c(3, 1))],
      },
      options: [optProg(seq("→↓↓→")), optProg(seq("↓↓→→")), optProg(seq("→→↓↓")), optProg(seq("→↓→↓"))],
    }),
  },
  {
    title: "¡Listo para empezar!",
    lines: ["Elegí una opción y tocá Confirmar."],
    facts: [
      // "{n}" se reemplaza por la cantidad de misiones de la prueba (4.º o 6.º).
      { badge: "{n}", title: "{n} misiones" },
      { badge: "⏱", title: "Sin apuro" },
      { badge: "?", title: "Sin botón Probar" },
    ],
  },
];

export type Practice = {
  title: string;
  lines: string[];
  demos: Demo[];
  /** Misiones de práctica con botón "Probar". */
  tries?: ItemA[];
};

/** Prácticas que se muestran antes de un ítem (clave = id del ítem). */
export const PRACTICES: Record<string, Practice> = {
  "A1.2": {
    title: "Misiones de pintar",
    lines: ["Empiezo en el punto verde. Cada flecha pinta un lado."],
    demos: [
      {
        map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→→↓")) },
        program: prog(seq("→→↓")),
      },
    ],
    tries: [
      practice({
        id: "P-pintar",
        task: "S",
        prompt: "¿Qué programa dibuja esta figura?",
        map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→↓→↓")) },
        options: [optProg(seq("→↓→↓")), optProg(seq("↓→↓→")), optProg(seq("→→↓↓")), optProg(seq("→↓→"))],
      }),
    ],
  },
  "A2.1": {
    title: "Bloque nuevo: repetir",
    lines: ["Hago lo de adentro esa cantidad de veces."],
    demos: [
      {
        map: { kind: "maze", cols: 4, rows: 1, start: c(1, 1), base: c(4, 1), paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)), e(c(3, 1), c(4, 1))] },
        program: prog([rep(3, seq("→"))]),
      },
    ],
  },
  "A2.2": {
    title: "Misiones de completar",
    lines: ["Elegí la pieza que va en el hueco amarillo."],
    demos: [],
    tries: [
      practice({
        id: "P-completar",
        task: "C",
        prompt: "Al programa le falta una pieza. ¿Cuál va en el hueco para llegar a la base?",
        map: {
          kind: "maze",
          cols: 4,
          rows: 2,
          start: c(1, 1),
          base: c(4, 2),
          paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)), e(c(3, 1), c(3, 2)), e(c(3, 2), c(4, 2)), e(c(1, 1), c(1, 2)), e(c(1, 2), c(2, 2))],
        },
        given: prog([...seq("→"), HOLE, ...seq("↓→")]),
        options: [optPiece(seq("→")), optPiece(seq("↓")), optPiece(seq("→→")), optPiece(seq("↑"))],
      }),
    ],
  },
  "A2.3": {
    title: "Misiones de arreglar",
    lines: ["Elegí el cambio que arregla el error."],
    demos: [],
    tries: [
      practice({
        id: "P-arreglar",
        task: "D",
        prompt: "El robot se choca: el programa tiene un error.",
        map: {
          kind: "maze",
          cols: 3,
          rows: 2,
          start: c(1, 1),
          base: c(3, 2),
          paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(2, 2)), e(c(2, 2), c(3, 2)), e(c(2, 1), c(3, 1))],
        },
        given: prog(seq("→↑→")),
        options: [
          optFix(seq("→↓→"), seq("↑"), seq("↓")),
          optFix(seq("→→→"), seq("↑"), seq("→")),
          optFix(seq("→←→"), seq("↑"), seq("←")),
          optFix(seq("→↓↓→"), seq("↑"), seq("↓↓")),
        ],
      }),
    ],
  },
  "A3.1": {
    title: "Bloques nuevos: repetir hasta y mientras",
    lines: ["Repito hasta llegar a la base, o mientras haya camino."],
    demos: [
      {
        map: {
          kind: "maze",
          cols: 5,
          rows: 1,
          start: c(1, 1),
          base: c(5, 1),
          paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)), e(c(3, 1), c(4, 1)), e(c(4, 1), c(5, 1))],
        },
        program: prog([until(seq("→"))]),
        label: "Repetir hasta",
      },
      {
        map: {
          kind: "maze",
          cols: 5,
          rows: 2,
          start: c(1, 1),
          base: c(3, 2),
          paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)), e(c(3, 1), c(3, 2)), e(c(4, 1), c(5, 1))],
        },
        program: prog([whileP("R", seq("→")), ...seq("↓")]),
        label: "Mientras haya",
      },
    ],
  },
  "A4.1": {
    title: "Un repetir adentro de otro",
    lines: ["En cada vuelta de afuera, hago todo el de adentro."],
    demos: [
      {
        map: { kind: "canvas", cols: 7, rows: 3, start: c(1, 3), target: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]) },
        program: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]),
      },
    ],
  },
  "A5.1": {
    title: "Bloque nuevo: si",
    lines: ["Hago lo de adentro solo si se cumple."],
    demos: [
      {
        map: { kind: "maze", cols: 4, rows: 2, start: c(1, 1), base: c(4, 2), allPaths: true, rocks: [c(3, 1)] },
        program: prog([until([ifRock("R", seq("↓")), ...seq("→")])]),
      },
    ],
  },
  "A6.1": {
    title: "Bloque nuevo: si no",
    lines: ["Si no se cumple, hago la otra parte."],
    demos: [
      {
        map: {
          kind: "maze",
          cols: 4,
          rows: 3,
          start: c(1, 1),
          base: c(4, 3),
          paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(2, 2)), e(c(2, 2), c(3, 2)), e(c(3, 2), c(3, 3)), e(c(3, 3), c(4, 3))],
        },
        program: prog([until([ifPath("R", seq("→"), seq("↓"))])]),
      },
    ],
  },
  "A7.1": {
    title: "Bloque nuevo: definir",
    lines: ["Le pongo un nombre a un grupo de bloques."],
    demos: [
      {
        map: { kind: "canvas", cols: 5, rows: 4, start: c(1, 4), target: prog([rep(3, [call("Paso")])], [{ name: "Paso", body: seq("→↑") }]) },
        program: prog([rep(3, [call("Paso")])], [{ name: "Paso", body: seq("→↑") }]),
      },
    ],
  },
  B1: {
    title: "Última parte: desafíos de lógica",
    lines: ["Leé, mirá el dibujo y elegí."],
    demos: [],
  },
};
