// Explicación para 4.º y 5.º (hacen la misma prueba): un ejercicio de cada formato de la parte A,
// para resolverlo en clase.
// El docente elige una opción y la prueba: el robot la ejecuta y se ve si está bien o mal.
// La parte B (desafíos de lógica) no se practica acá. Son ejercicios NUEVOS (parecidos, no iguales a los
// de la prueba) y no se guardan ni cuentan para nada.
import { c, e, optFix, optPiece, optProg, prog, rep, seq, HOLE, type Item, type ItemA } from "./model";

/** reserve: alto que se deja libre alrededor del mapa (más alto = mapa más chico, para que entren las opciones al lado). */
export type Explained = { key: string; title: string; item: Item; reserve?: number };

// ───────── Parte A ─────────

const elegirLaberinto: ItemA = {
  id: "X1",
  part: "A",
  block: "A1",
  concept: "secuencias",
  task: "S",
  prompt: "¿Qué programa lleva al robot hasta la base?",
  map: {
    kind: "maze",
    cols: 4,
    rows: 3,
    start: c(1, 1),
    base: c(4, 3),
    paths: [
      e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)),
      e(c(3, 1), c(3, 2)), e(c(3, 2), c(4, 2)), e(c(4, 2), c(4, 3)),
      e(c(1, 1), c(1, 2)), e(c(1, 2), c(2, 2)), e(c(2, 2), c(2, 3)), e(c(2, 3), c(3, 3)),
      e(c(4, 1), c(4, 2)),
    ],
  },
  options: [optProg(seq("→→→↓↓")), optProg(seq("→↓→↓→")), optProg(seq("→→↓→↓")), optProg(seq("→→↓↓→"))],
  correct: 2,
};

const elegirDibujo: ItemA = {
  id: "X2",
  part: "A",
  block: "A1",
  concept: "secuencias",
  task: "S",
  prompt: "¿Qué programa dibuja esta figura?",
  map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→→↓↓←")) },
  options: [optProg(seq("→→↓←↓")), optProg(seq("→→↓↓←")), optProg(seq("→↓↓←")), optProg(seq("→→↓↓→"))],
  correct: 1,
};

const completar: ItemA = {
  id: "X3",
  part: "A",
  block: "A2",
  concept: "repetir",
  task: "C",
  prompt: "Al programa le falta una pieza. ¿Cuál va en el hueco para llegar a la base?",
  map: {
    kind: "maze",
    cols: 5,
    rows: 3,
    start: c(1, 1),
    base: c(5, 3),
    paths: [
      e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)),
      e(c(3, 1), c(3, 2)), e(c(3, 2), c(3, 3)),
      e(c(3, 3), c(4, 3)), e(c(4, 3), c(5, 3)),
      e(c(3, 1), c(4, 1)), e(c(4, 1), c(5, 1)),
      e(c(1, 1), c(1, 2)),
    ],
  },
  given: prog([rep(2, seq("→")), HOLE, rep(2, seq("→"))]),
  options: [optPiece([rep(2, seq("↓"))]), optPiece([rep(2, seq("→"))]), optPiece([rep(3, seq("↓"))]), optPiece(seq("↓"))],
  correct: 0,
};

const arreglar: ItemA = {
  id: "X4",
  part: "A",
  block: "A2",
  concept: "repetir",
  task: "D",
  prompt: "El robot se choca: el programa tiene un error.",
  map: {
    kind: "maze",
    cols: 4,
    rows: 4,
    start: c(1, 1),
    base: c(4, 4),
    paths: [
      e(c(1, 1), c(1, 2)), e(c(1, 2), c(1, 3)),
      e(c(1, 3), c(2, 3)), e(c(2, 3), c(3, 3)), e(c(3, 3), c(4, 3)),
      e(c(4, 3), c(4, 4)),
      e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)),
      e(c(2, 4), c(3, 4)),
    ],
  },
  given: prog([rep(3, seq("↓")), rep(3, seq("→")), ...seq("↓")]),
  options: [
    optFix([rep(3, seq("↓")), rep(2, seq("→")), ...seq("↓")], [rep(3, seq("→"))], [rep(2, seq("→"))]),
    optFix([rep(4, seq("↓")), rep(3, seq("→")), ...seq("↓")], [rep(3, seq("↓"))], [rep(4, seq("↓"))]),
    optFix([rep(3, seq("↓")), rep(3, seq("→")), ...seq("→")], seq("↓"), seq("→")),
    optFix([rep(2, seq("↓")), rep(3, seq("→")), ...seq("↓")], [rep(3, seq("↓"))], [rep(2, seq("↓"))]),
  ],
  correct: 3,
};

export const EXPLAINED: Explained[] = [
  { key: "elegir-laberinto", title: "Elegir el camino", item: elegirLaberinto },
  { key: "elegir-dibujo", title: "Elegir el dibujo", item: elegirDibujo },
  { key: "completar", title: "Completar el hueco", item: completar },
  { key: "arreglar", title: "Arreglar el error", item: arreglar, reserve: 450 },
];
