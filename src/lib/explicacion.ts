// Explicación para 4.º: un ejercicio de cada formato de la prueba, para resolverlo en clase.
// El docente elige una opción y la comprueba: en la parte A el robot la ejecuta y se ve si está bien o mal;
// en la parte B se dice si es correcta. Son ejercicios NUEVOS (parecidos, no iguales a los de la prueba)
// y no se guardan ni cuentan para nada.
import { c, e, optFix, optPiece, optProg, prog, rep, seq, HOLE, type Item, type ItemA, type ItemB } from "./model";

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

// ───────── Parte B ─────────

const collar: ItemB = {
  id: "X5",
  part: "B",
  practice: "patrones",
  facts: ["El collar empieza en el nudo y sigue un patrón que se repite."],
  prompt: "¿Qué instrucción arma este collar?",
  figure: "collar-x",
  optionFigure: "collar-x",
  options: ["repetir { ● ▲ }", "repetir { ● ● ▲ }", "repetir { ● ▲ ▲ }", "repetir { ▲ ▲ ● }"],
  correct: 2,
};

const tarjetas: ItemB = {
  id: "X6",
  part: "B",
  practice: "representacion",
  facts: [
    "Cada tarjeta vale los puntos que tiene: 8, 4, 2 y 1.",
    "Para formar un número se eligen tarjetas y se suman sus puntos. Cada tarjeta se usa una sola vez.",
  ],
  prompt: "¿Qué tarjetas forman el 6?",
  figure: "tarjetas-x",
  optionFigure: "tarjetas-x",
  options: ["4 y 2", "4 y 1", "4, 2 y 1", "2 y 1"],
  correct: 0,
};

const mapa: ItemB = {
  id: "X7",
  part: "B",
  practice: "abstraccion",
  facts: ["El mapa muestra los caminos del barrio.", "El número de cada camino es la cantidad de cuadras."],
  prompt: "¿Cuál es el camino más corto de la casa a la escuela?",
  figure: "mapa-x",
  options: ["Casa → Panadería → Escuela", "Casa → Escuela por la avenida", "Casa → Panadería → Plaza → Escuela", "Casa → Plaza → Escuela"],
  correct: 3,
};

const luces: ItemB = {
  id: "X8",
  part: "B",
  practice: "evaluar",
  facts: [
    "Hay una fila de 6 luces. Algunas están prendidas y otras apagadas.",
    "Cada luz tiene un botón que la cambia: si está prendida la apaga y si está apagada la prende.",
    "El robot recorre la fila pasando por cada luz.",
  ],
  prompt: "¿Qué instrucción prende todas las luces, sin importar cuáles estaban apagadas?",
  figure: "luces-x",
  options: [
    "En cada luz: apretar el botón",
    "En cada luz: si está apagada, apretar el botón",
    "En la última luz: apretar el botón 6 veces",
    "Pasar por todas las luces sin apretar nada",
  ],
  correct: 1,
};

const puerta: ItemB = {
  id: "X9",
  part: "B",
  practice: "logica",
  facts: ["La puerta se abre solo si el robot tiene la llave Y la luz está verde."],
  prompt: "¿En cuál de estas situaciones se abre la puerta?",
  figure: "puerta-x",
  optionFigure: "puerta-x",
  options: [
    "Tiene la llave y la luz está roja",
    "No tiene la llave y la luz está verde",
    "Tiene la llave y la luz está verde",
    "No tiene la llave y la luz está roja",
  ],
  correct: 2,
};

export const EXPLAINED: Explained[] = [
  { key: "elegir-laberinto", title: "Elegir el camino", item: elegirLaberinto },
  { key: "elegir-dibujo", title: "Elegir el dibujo", item: elegirDibujo },
  { key: "completar", title: "Completar el hueco", item: completar },
  { key: "arreglar", title: "Arreglar el error", item: arreglar, reserve: 450 },
  { key: "collar", title: "El collar", item: collar },
  { key: "tarjetas", title: "Las tarjetas", item: tarjetas },
  { key: "mapa", title: "El mapa", item: mapa },
  { key: "luces", title: "Las luces", item: luces },
  { key: "puerta", title: "La puerta", item: puerta },
];
