// Contenido del tutorial inicial y de las prácticas (no puntúan). Se muestra en la ventana
// emergente violeta (components/Tutorial.tsx): el robot guía dice el título y las líneas.
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
};

/** Tarjeta de "Así va a ser la prueba". */
export type Fact = { badge: string; title: string; text: string };

export type TutorialStep = {
  title: string;
  lines: string[];
  demo?: Demo;
  /** Muestra la leyenda de los tipos de bloque. */
  legend?: boolean;
  /** Misión de práctica con botón "Probar". */
  tryIt?: ItemA;
  /** Tarjetas con datos de la prueba. */
  facts?: Fact[];
};

/** Lo que dice el robot cuando, después de una demostración, le toca probar al chico. */
export const TRY_AFTER_DEMO = {
  title: "¡Ahora probá vos!",
  lines: ["Tocá una opción y apretá Probar para ver qué hago.", "Si no funciona, no pasa nada: probá otra. Para eso es la práctica."],
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
    title: "¡Hola! Te muestro cómo me muevo.",
    lines: [
      "Voy de una isla a otra cruzando los puentes. Donde no hay puente, no puedo pasar.",
      "Las rocas tapan la isla: ahí no puedo entrar.",
      "La misión se cumple si, cuando termina el programa, estoy en la base (la bandera verde).",
    ],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→")) },
  },
  {
    title: "Si voy por donde no hay puente, me choco.",
    lines: ["También me choco contra una roca o si me salgo del mapa.", "Mirá: en el segundo paso de este programa no hay puente."],
    demo: { map: INTRO_MAP, program: prog(seq("→→")) },
  },
  {
    title: "Pasarme de largo también es fallar.",
    lines: ["Acá piso la base pero sigo caminando. Cuando termina el programa no estoy en la base, así que la misión falla."],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→→")) },
  },
  {
    title: "Los programas se leen de arriba hacia abajo.",
    lines: [
      "Cada bloque va enganchado debajo del anterior. Primero hago el de arriba, después el que sigue, y así hasta el último.",
      "Además de las flechas hay bloques especiales. Antes de usar cada uno te voy a mostrar un ejemplo.",
    ],
    legend: true,
  },
  {
    title: "¡Ahora probá vos!",
    lines: ["Así se ve una misión: el mapa y, al lado, las opciones.", "Tocá el programa que me lleva a la base y apretá Probar. Si no funciona, probá otro."],
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
    title: "¿Cómo funciona la prueba?",
    lines: [
      "Cuando aprietes Empezar, esta ventana violeta se cierra y empiezan las misiones.",
      "Ahí sí te toca resolver a vos. ¡Suerte!",
    ],
    facts: [
      { badge: "28", title: "28 misiones", text: "En cada una elegís una opción y apretás Confirmar. No se puede volver atrás." },
      { badge: "45", title: "45 minutos en total", text: "No hace falta apurarse: pensá bien cada misión." },
      { badge: "?", title: "No hay botón Probar", text: "Tenés que pensar qué haría el robot con cada programa." },
      { badge: "✓", title: "¿No estás seguro?", text: "Elegí la opción que te parezca mejor." },
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
    lines: [
      "En estas misiones no hay islas: llevo un pincel y pinto una línea por donde camino.",
      "Empiezo en el punto verde. Cada flecha me mueve un lado de un cuadradito.",
      "La pregunta va a ser qué programa dibuja la figura naranja.",
    ],
    demos: [
      {
        map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→→↓")) },
        program: prog(seq("→→↓")),
        outcome: "Las dos flechas → pintaron dos lados hacia la derecha y la ↓ pintó uno hacia abajo.",
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
    title: "Bloque nuevo: repetir N veces",
    lines: ["Hago lo que tiene adentro esa cantidad de veces.", "Este programa es lo mismo que poner tres → uno debajo del otro."],
    demos: [
      {
        map: { kind: "maze", cols: 4, rows: 1, start: c(1, 1), base: c(4, 1), paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(3, 1)), e(c(3, 1), c(4, 1))] },
        program: prog([rep(3, seq("→"))]),
      },
    ],
  },
  "A2.2": {
    title: "Misiones de completar",
    lines: [
      "En estas misiones al programa le falta una pieza: el hueco amarillo.",
      "Cuando tocás una opción, la pieza se pone en el hueco y brilla, así ves cómo queda. Probá y apretá Probar.",
    ],
    demos: [],
    tries: [
      practice({
        id: "P-completar",
        task: "C",
        prompt: "¿Qué pieza va en el hueco para que el robot llegue a la base?",
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
    lines: [
      "En estas misiones el programa tiene un error. La línea roja muestra por dónde voy y la cruz, dónde me choco.",
      "Cada opción es un cambio: lo de la izquierda se cambia por lo de la derecha. Tocá uno y apretá Probar.",
    ],
    demos: [],
    tries: [
      practice({
        id: "P-arreglar",
        task: "D",
        prompt: "El robot se choca. ¿Qué cambio arregla el programa?",
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
    title: "Bloques nuevos: repetir hasta la base, y mientras haya camino",
    lines: [
      "Repetir hasta la base: hago lo de adentro una y otra vez, y paro apenas piso la base.",
      "Mientras haya camino a la derecha: antes de cada vuelta miro si puedo moverme para ese lado. Cuando no hay puente o hay una roca, dejo de repetir.",
    ],
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
        outcome: "Avancé mientras hubo camino a la derecha. Cuando se terminaron los puentes, salí del bucle y seguí con el ↓.",
      },
    ],
  },
  "A4.1": {
    title: "Un repetir adentro de otro",
    lines: ["Por cada vuelta del repetir de afuera, el de adentro hace todas sus vueltas.", "Mirá cómo se forma la figura."],
    demos: [
      {
        map: { kind: "canvas", cols: 7, rows: 3, start: c(1, 3), target: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]) },
        program: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]),
        outcome: "Dos vueltas de afuera; en cada una, tres pasos a la derecha y uno arriba.",
      },
    ],
  },
  "A5.1": {
    title: "Bloque nuevo: si hay roca a la derecha",
    lines: [
      "Con el bloque si miro la isla de al lado. Si la condición se cumple, hago lo que tiene adentro; si no, lo salteo y sigo con el bloque de abajo.",
      "En este mapa todas las islas tienen puentes: solo tengo que esquivar la roca.",
    ],
    demos: [
      {
        map: { kind: "maze", cols: 4, rows: 2, start: c(1, 1), base: c(4, 2), allPaths: true, rocks: [c(3, 1)] },
        program: prog([until([ifRock("R", seq("↓")), ...seq("→")])]),
      },
    ],
  },
  "A6.1": {
    title: "Bloque nuevo: si no",
    lines: ["Si la condición se cumple, hago la primera parte. Si no se cumple, hago la parte de si no.", "Siempre hago una de las dos."],
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
    lines: ["Definir crea un bloque nuevo con un nombre.", "Cada vez que aparece ese nombre en el programa, hago lo que está adentro de la definición."],
    demos: [
      {
        map: { kind: "canvas", cols: 5, rows: 4, start: c(1, 4), target: prog([rep(3, [call("Paso")])], [{ name: "Paso", body: seq("→↑") }]) },
        program: prog([rep(3, [call("Paso")])], [{ name: "Paso", body: seq("→↑") }]),
        outcome: "Paso es → ↑. Repetirlo 3 veces dibuja una escalera.",
      },
    ],
  },
  B1: {
    title: "Última parte: desafíos de lógica",
    lines: [
      "Las próximas 8 misiones no son para programarme: son desafíos para pensar.",
      "Leé con atención los datos, mirá el dibujo y elegí la respuesta que te parezca correcta.",
    ],
    demos: [],
  },
};

/** Entrada de la leyenda: el bloque real (si lo hay) o un bloque de texto. */
export type LegendEntry = { fam: "move" | "loop" | "cond" | "func"; title: string; text: string; block?: Block };

export const LEGEND: LegendEntry[] = [
  { fam: "move", title: "↑ ↓ ← →", text: "mover una casilla" },
  { fam: "loop", title: "repetir 3 veces", text: "hace lo de adentro esa cantidad de veces", block: rep(3, []) },
  { fam: "loop", title: "repetir hasta la base", text: "repite hasta que el robot pisa la base", block: until([]) },
  { fam: "loop", title: "mientras haya camino a la derecha", text: "repite mientras pueda moverse hacia ahí", block: whileP("R", []) },
  { fam: "cond", title: "si hay roca a la derecha", text: "hace lo de adentro solo si se cumple", block: ifRock("R", []) },
  { fam: "cond", title: "si no", text: "lo que hace cuando no se cumple" },
  { fam: "func", title: "definir Paso", text: "crea un bloque nuevo con ese nombre" },
];
