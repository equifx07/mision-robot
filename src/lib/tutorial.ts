// Contenido del tutorial inicial y de las prácticas (no puntúan).
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

export type TutorialStep = {
  title: string;
  lines: string[];
  demo?: Demo;
  /** Muestra la leyenda de los tipos de bloque. */
  legend?: boolean;
  /** Misión de práctica con botón "Probar". */
  tryIt?: ItemA;
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
    title: "¡Hola! Vas a ayudar a un robot a cumplir misiones.",
    lines: [
      "El robot se mueve de a una isla, cruzando los puentes. Donde no hay puente, no puede pasar.",
      "Las rocas tapan la isla: el robot no puede entrar.",
      "La misión se cumple si, al terminar el programa, el robot está en la base (la bandera verde).",
    ],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→")) },
  },
  {
    title: "Si el robot va por donde no hay puente, contra una roca o fuera del mapa, se choca.",
    lines: ["Este programa no sirve: en el segundo paso no hay puente. Apretá ▶ y mirá qué pasa."],
    demo: { map: INTRO_MAP, program: prog(seq("→→")) },
  },
  {
    title: "Pasarse de largo también es fallar.",
    lines: ["Acá el robot pisa la base pero sigue caminando. Al terminar el programa no está en la base, así que la misión falla."],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→→")) },
  },
  {
    title: "Los programas se leen en orden, como un texto.",
    lines: [
      "De izquierda a derecha y de arriba hacia abajo. Las flechas seguidas van en fila.",
      "Además de las flechas hay bloques especiales. Antes de usar cada uno vas a ver un ejemplo con el robot.",
    ],
    legend: true,
  },
  {
    title: "¡Probá vos!",
    lines: ["Así se ve una misión: el mapa a la izquierda y las opciones a la derecha. Tocá el programa que lleva al robot a la base y apretá ▶ Probar."],
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
      "Son 28 misiones. En cada una elegí una opción y apretá Confirmar. No se puede volver atrás.",
      "En la prueba no hay botón Probar: tenés que pensar qué haría el robot.",
      "Tenés 45 minutos en total. No hace falta apurarse: pensá bien cada misión.",
      "Si no estás seguro, elegí la que te parezca mejor. Cuando estés listo, apretá Empezar.",
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
      "Acá no hay islas: el robot lleva un pincel y pinta una línea por donde camina.",
      "Empieza en el punto verde. Cada flecha lo mueve un lado de un cuadradito.",
      "La pregunta es qué programa dibuja la figura naranja.",
    ],
    demos: [
      {
        map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→→↓")) },
        program: prog(seq("→→↓")),
        outcome: "Dos flechas → pintaron dos lados hacia la derecha y la ↓ pintó uno hacia abajo.",
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
    lines: ["Hace lo que tiene adentro esa cantidad de veces. Este programa es lo mismo que → → →."],
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
      "Al programa le falta una pieza: el hueco amarillo.",
      "Cuando tocás una opción, la pieza se pone en el hueco y brilla, así ves cómo queda el programa.",
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
      "Este programa tiene un error. En el mapa se ve qué pasa: la línea roja es por donde va el robot y la cruz, dónde se choca.",
      "Cada opción es un cambio: lo de la izquierda se cambia por lo de la derecha. Al tocarla, ves el programa con ese cambio.",
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
      "Repetir hasta la base: hace lo de adentro una y otra vez, y se detiene apenas el robot pisa la base.",
      "Mientras haya camino →: antes de cada vuelta mira si puede moverse para ese lado. Cuando no hay puente o hay una roca, deja de repetir.",
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
        outcome: "El robot avanzó mientras hubo camino a la derecha. Cuando se terminaron los puentes, salió del bucle y siguió con el ↓.",
      },
    ],
  },
  "A4.1": {
    title: "Un repetir adentro de otro",
    lines: ["Por cada vuelta del repetir de afuera, el de adentro hace todas sus vueltas. Mirá cómo se forma la figura."],
    demos: [
      {
        map: { kind: "canvas", cols: 7, rows: 3, start: c(1, 3), target: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]) },
        program: prog([rep(2, [rep(3, seq("→")), ...seq("↑")])]),
        outcome: "Dos vueltas de afuera; en cada una, tres pasos a la derecha y uno arriba.",
      },
    ],
  },
  "A5.1": {
    title: "Bloque nuevo: si hay roca →",
    lines: [
      "El bloque si mira la isla de al lado. Si la condición se cumple, hace lo que tiene adentro; si no, lo saltea y sigue con el bloque de abajo.",
      "En este mapa todas las islas tienen puentes: solo hay que esquivar la roca.",
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
    lines: ["Si la condición se cumple, hace la primera parte. Si no se cumple, hace la parte de si no. Siempre hace una de las dos."],
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
    lines: ["Definir crea un bloque nuevo con un nombre. Cada vez que aparece ese nombre en el programa, el robot hace lo que está adentro de la definición."],
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
      "Las próximas 8 misiones no tienen robot que programar. Son desafíos para pensar.",
      "Leé con atención los datos, mirá el dibujo y elegí la respuesta que te parezca correcta.",
    ],
    demos: [],
  },
};

export type LegendEntry = { fam: "move" | "loop" | "cond" | "func"; title: string; text: string };

export const LEGEND: LegendEntry[] = [
  { fam: "move", title: "↑ ↓ ← →", text: "mover una casilla" },
  { fam: "loop", title: "repetir 3 veces", text: "hace lo de adentro esa cantidad de veces" },
  { fam: "loop", title: "repetir hasta la base", text: "repite hasta que el robot pisa la base" },
  { fam: "loop", title: "mientras haya camino →", text: "repite mientras pueda moverse hacia ahí" },
  { fam: "cond", title: "si hay roca →", text: "hace lo de adentro solo si se cumple" },
  { fam: "cond", title: "si no", text: "lo que hace cuando no se cumple" },
  { fam: "func", title: "definir Paso", text: "crea un bloque nuevo con ese nombre" },
];
