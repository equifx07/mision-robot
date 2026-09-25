// Parte B — "Desafíos de lógica" (8 ítems, sin código). Ver docs/02-banco-de-items.md.
import type { ItemB } from "./model";

export const ITEMS_B: ItemB[] = [
  {
    id: "B1",
    part: "B",
    practice: "descomposicion",
    prompt:
      "Hay que pintar una pared. Las tareas y lo que tarda cada una: mover los muebles, 10 minutos; tapar el piso, 5 minutos; pintar, 30 minutos. Dos robots trabajan al mismo tiempo, pero pintar solo puede empezar cuando las otras dos tareas terminaron. ¿Cuál es el menor tiempo total?",
    figure: "pared",
    options: ["40 minutos", "45 minutos", "35 minutos", "30 minutos"],
    correct: 0,
    notes: "Las dos primeras tareas van en paralelo (10), después pintar (30). 45 es todo en serie.",
  },
  {
    id: "B2",
    part: "B",
    practice: "patrones",
    prompt: "Este collar sigue un patrón que se repite. ¿Qué instrucción lo genera?",
    figure: "collar",
    options: ["repetir { ● ● ▲ }", "repetir { ● ▲ ● }", "repetir { ● ▲ }", "repetir { ● ● ▲ ▲ }"],
    correct: 0,
    notes: "Reconocer el período del patrón desde el nudo.",
  },
  {
    id: "B3",
    part: "B",
    practice: "patrones",
    prompt: "Para acortar mensajes, en vez de escribir AAABBBBCC se escribe 3A4B2C. ¿Cómo se escribe RRRRRVVVAA?",
    figure: "compresion",
    options: ["5R3V2A", "4R3V2A", "5R2V3A", "R5V3A2"],
    correct: 0,
    notes: "Generalizar una regla de codificación a partir de un ejemplo.",
  },
  {
    id: "B4",
    part: "B",
    practice: "representacion",
    prompt:
      "Cada tarjeta tiene una cantidad de puntos: 8, 4, 2 y 1. Para formar un número se dan vuelta algunas tarjetas y se suman sus puntos. Por ejemplo, el 5 se forma con las tarjetas 4 y 1. ¿Qué tarjetas forman el 11?",
    figure: "tarjetas",
    options: ["8, 2 y 1", "8 y 4", "4, 2 y 1", "8, 4 y 1"],
    correct: 0,
    notes: "Representación binaria sin nombrarla.",
  },
  {
    id: "B5",
    part: "B",
    practice: "abstraccion",
    prompt:
      "El mapa muestra los caminos entre la escuela y la plaza. El número de cada camino es la cantidad de cuadras. ¿Cuál es el camino más corto de la escuela a la plaza?",
    figure: "mapa",
    options: [
      "Escuela → Kiosco → Plaza",
      "Escuela → Club → Plaza",
      "Escuela → Plaza por la avenida",
      "Escuela → Club → Kiosco → Plaza",
    ],
    correct: 0,
    notes: "Grafo con pesos: 5 contra 6, 7 y 6.",
  },
  {
    id: "B6",
    part: "B",
    practice: "algoritmo",
    prompt:
      "Cuatro robots están en fila con estos números: 3, 1, 4, 2. Un inspector empieza por la izquierda y sigue esta regla: mira dos robots vecinos; si el de la izquierda tiene un número mayor que el de la derecha, los intercambia; después avanza un lugar. Cuando llega al final de la fila, ¿cómo quedan los robots?",
    figure: "fila",
    options: ["1, 3, 2, 4", "1, 2, 3, 4", "3, 1, 2, 4", "1, 3, 4, 2"],
    correct: 0,
    notes: "Una pasada de burbuja. El distractor 'todo ordenado' es el error típico.",
  },
  {
    id: "B7",
    part: "B",
    practice: "evaluar",
    prompt:
      "Hay una fila de 6 luces y algunas están prendidas. El robot recorre la fila y en cada luz puede apretar el botón, que la cambia: si estaba prendida se apaga y si estaba apagada se prende. ¿Qué instrucción apaga todas las luces sin importar cuáles estén prendidas?",
    figure: "luces",
    options: [
      "Avanzar de a una luz; si está prendida, apretar el botón",
      "Avanzar de a una luz y apretar el botón en todas",
      "Apretar el botón 6 veces sin moverse",
      "Avanzar hasta el final sin apretar nada",
    ],
    correct: 0,
    notes: "Evaluar qué instrucción generaliza a cualquier configuración inicial.",
  },
  {
    id: "B8",
    part: "B",
    practice: "logica",
    prompt:
      "La puerta se abre si el robot tiene la llave O la luz está verde. Pero NUNCA se abre si el robot lleva una gema. ¿En cuál de estas situaciones se abre la puerta?",
    figure: "puerta",
    options: [
      "Tiene la llave, la luz está roja y no lleva gema",
      "No tiene la llave, la luz está verde y lleva una gema",
      "No tiene la llave, la luz está roja y no lleva gema",
      "Tiene la llave, la luz está verde y lleva una gema",
    ],
    correct: 0,
    notes: "Combinación de O, Y y NO.",
  },
];
