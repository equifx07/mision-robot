// Contenido del tutorial inicial y de las prácticas por bloque (no puntúan).
import { c, call, e, ifPath, ifRock, prog, rep, seq, until, whileP, type GameMap, type Program } from "./model";

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
};

const INTRO_MAP: GameMap = {
  kind: "maze",
  cols: 4,
  rows: 3,
  start: c(1, 1),
  base: c(3, 2),
  rocks: [c(4, 1)],
  gems: [c(2, 2)],
  paths: [e(c(1, 1), c(2, 1)), e(c(2, 1), c(2, 2)), e(c(2, 2), c(3, 2)), e(c(3, 2), c(4, 2)), e(c(3, 1), c(3, 2)), e(c(1, 2), c(1, 3)), e(c(1, 3), c(2, 3)), e(c(2, 3), c(3, 3))],
};

export const INTRO: TutorialStep[] = [
  {
    title: "¡Hola! Vas a ayudar a un robot a cumplir misiones.",
    lines: [
      "El robot se mueve de a una casilla por los caminos (los puentes entre casillas).",
      "Donde no hay camino, hay pared: no puede pasar.",
      "Las rocas tapan la casilla: no puede entrar. Las gemas se juntan solas al pasar.",
      "La misión se cumple si, al terminar el programa, el robot está en la base (la bandera verde).",
    ],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→")) },
  },
  {
    title: "Si el robot intenta pasar por una pared, una roca o fuera del mapa, se choca.",
    lines: ["Este programa no sirve: el segundo paso va contra una pared. Apretá ▶ y mirá qué pasa."],
    demo: { map: INTRO_MAP, program: prog(seq("→→")) },
  },
  {
    title: "Pasarse de largo también es fallar.",
    lines: ["Acá el robot pisa la base pero sigue caminando. Al terminar el programa no está en la base, así que la misión falla."],
    demo: { map: INTRO_MAP, program: prog(seq("→↓→→")) },
  },
  {
    title: "En los mapas de pintura, el robot deja un rastro.",
    lines: ["No hay base ni paredes: la pregunta va a ser qué programa dibuja una figura. Apretá ▶ para ver cómo pinta."],
    demo: {
      map: { kind: "canvas", cols: 4, rows: 3, start: c(1, 1), target: prog(seq("→→↓")) },
      program: prog(seq("→→↓")),
      outcome: "El robot pintó una L. Cada movimiento deja una línea.",
    },
  },
  {
    title: "Los programas se leen de arriba hacia abajo.",
    lines: [
      "Además de las flechas, hay bloques especiales. Antes de cada tipo de misión vas a ver un ejemplo con el robot en acción.",
    ],
    legend: true,
  },
  {
    title: "¿Cómo funciona la prueba?",
    lines: [
      "Son 28 misiones. En cada una elegí una opción y apretá Confirmar. No se puede volver atrás.",
      "Tenés 45 minutos en total. No hace falta apurarse: pensá bien cada misión.",
      "No hay respuestas a medias: si no estás seguro, elegí la que te parezca mejor.",
      "Cuando estés listo, apretá Empezar.",
    ],
  },
];

export type Practice = {
  title: string;
  lines: string[];
  demos: Demo[];
};

/** Prácticas que se muestran antes del primer ítem de cada bloque (clave = id del ítem). */
export const PRACTICES: Record<string, Practice> = {
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
  "A3.1": {
    title: "Bloques nuevos: repetir hasta llegar a la base, y mientras haya camino",
    lines: [
      "Repetir hasta llegar a la base: hace lo de adentro una y otra vez, y se detiene apenas el robot pisa la base.",
      "Mientras haya camino →: antes de cada vuelta mira si puede moverse en esa dirección. Cuando hay pared o roca, deja de repetir.",
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
        outcome: "El robot avanzó mientras hubo camino a la derecha. Cuando encontró la pared, salió del bucle y siguió con el ↓.",
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
      "El bloque si mira una casilla vecina. Si la condición se cumple, hace lo que tiene adentro; si no, lo saltea y sigue con el bloque de abajo.",
      "En este mapa todas las casillas están conectadas: solo hay que esquivar la roca.",
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
    lines: [
      "Definir crea un bloque nuevo con un nombre. Cada vez que aparece ese nombre en el programa, el robot hace lo que está en la definición.",
    ],
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
      "Leé con atención, mirá la figura y elegí la respuesta que te parezca correcta.",
    ],
    demos: [],
  },
};

export const LEGEND: { title: string; text: string; color: string }[] = [
  { title: "↑ ↓ ← →", text: "mover una casilla", color: "bg-sky-500" },
  { title: "repetir N veces", text: "hace lo de adentro N veces", color: "bg-amber-500" },
  { title: "repetir hasta llegar a la base", text: "repite hasta que el robot pisa la base", color: "bg-amber-600" },
  { title: "mientras haya camino →", text: "repite mientras pueda moverse hacia ahí", color: "bg-amber-600" },
  { title: "si hay roca → / si hay camino →", text: "hace lo de adentro solo si se cumple", color: "bg-emerald-600" },
  { title: "si no", text: "lo que hace cuando no se cumple", color: "bg-emerald-700" },
  { title: "definir Nombre", text: "crea un bloque nuevo con ese nombre", color: "bg-violet-700" },
];
