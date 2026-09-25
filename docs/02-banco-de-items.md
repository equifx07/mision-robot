# Misión Robot (EPC-6) — Banco de ítems

Estado: borrador. Bloques A1–A3 en detalle para aprobación; A4–B8 a nivel de diseño, se detallan al aprobarse el estilo.

Decisiones ya tomadas (2026-09-25): 20 ítems Parte A + 8 Parte B, construcción en fase 2; personaje robot explorador; flechas absolutas; sin retroalimentación durante la prueba; cierre sin puntaje; datos iniciales: nombre, curso, colegio (desplegable administrado), edad, experiencia previa en programación, género opcional; límite global 45 min, sin límite por ítem, tiempos registrados; tutorial inicial + 1 práctica animada por bloque; opciones en orden aleatorio por estudiante; una sola toma por chico; niveles provisorios; nombre "Misión Robot" / EPC-6; dispositivo principal Chromebook 11", adaptable; stack en VM con Coolify; un único usuario admin; voseo.

---

## 0. Reglas del mundo (se enseñan en el tutorial, con animación)

1. El robot se mueve de a una casilla por los **caminos** dibujados entre casillas. Donde no hay camino hay pared.
2. Las **rocas** bloquean la casilla: el robot no puede entrar.
3. Si el robot intenta moverse por donde no hay camino, contra una roca o afuera del mapa, **se choca** y la misión falla.
4. Las **gemas** se juntan solas al pasar por su casilla.
5. La misión se cumple si, **al terminar el programa**, el robot está parado en la **base** (y juntó todas las gemas cuando la consigna lo pide). Pasarse de largo también es fallar.
6. En los mapas de **pintura** (lienzo) el robot deja un rastro; la pregunta es qué programa dibuja la figura.

Condiciones que el robot puede "sentir" (se muestran como íconos):
- `hay roca →` (o ↑ ↓ ←): la casilla vecina en esa dirección tiene una roca.
- `hay camino →` (o ↑ ↓ ←): se puede mover en esa dirección (hay camino y no hay roca).

## 0.1 Bloques (columna vertical, estilo Scratch / Pilas Bloques)

| Bloque | Significado |
|---|---|
| `↑ ↓ ← →` | mover una casilla |
| `repetir N veces { … }` | bucle contado |
| `repetir hasta llegar a la base { … }` | bucle hasta condición de fin |
| `mientras haya camino → { … }` | bucle con condición al inicio |
| `si hay roca → { … }` | condicional simple |
| `si … { … } si no { … }` | condicional doble |
| `definir Nombre { … }` y `Nombre` | función simple y su llamada |

Notación en este documento: `{ … }` encierra el cuerpo del bloque; en la app cada bloque es una tarjeta y el cuerpo va indentado.

Notación de mapas: `R` robot, `B` base, `X` roca, `*` gema, `·` casilla vacía, `─` y `│` caminos (donde no hay línea hay pared). En lienzo: `S` inicio y `━ ┃` rastro pintado. Coordenadas (columna, fila) con (1,1) arriba a la izquierda.

Tipos de tarea: **S** secuenciar (elegir el programa completo), **C** completar (falta una pieza), **D** depurar (programa con error; se eligen entre 4 programas corregidos, con el cambio resaltado).

---

## Parte A — "Programá al robot" (20 ítems)

### A1 — Secuencias (2 ítems)

#### A1.1 · laberinto · S · ancla fácil
Consigna: *Llevá al robot hasta la base.*

```
R ─ ·   · ─ ·
    │       │
· ─ · ─ ·   ·
│       │   │
· ─ ·   · ─ B
    │   │
· ─ · ─ · ─ ·
```
Caminos: (1,1)-(2,1), (3,1)-(4,1), (2,1)-(2,2), (4,1)-(4,2), (1,2)-(2,2), (2,2)-(3,2), (1,2)-(1,3), (3,2)-(3,3), (4,2)-(4,3), (1,3)-(2,3), (3,3)-(4,3), (2,3)-(2,4), (3,3)-(3,4), (1,4)-(2,4), (2,4)-(3,4), (3,4)-(4,4). Base en (4,3).

| Opción | Programa | Resultado |
|---|---|---|
| **a ✓** | `→ ↓ → ↓ →` | llega a la base |
| b | `→ → ↓ ↓ →` | se choca contra la pared entre (2,1) y (3,1) |
| c | `↓ → ↓ → →` | se choca: no hay camino abajo desde el inicio |
| d | `→ ↓ → ↓ ↓` | termina en (3,4), no en la base |

Distractores: mismas flechas en otro orden (b, c) y un paso final equivocado (d).

#### A1.2 · lienzo · S
Consigna: *El robot pinta mientras se mueve. ¿Qué programa dibuja esta figura?*

```
S ━ · ━ ·
        ┃
    · ━ ·
    ┃
    · ━ ·
```
Rastro: (1,1)→(2,1)→(3,1)↓(3,2)←(2,2)↓(2,3)→(3,3).

| Opción | Programa | Resultado |
|---|---|---|
| **a ✓** | `→ → ↓ ← ↓ →` | la figura |
| b | `→ → ↓ → ↓ ←` | figura espejada |
| c | `→ ↓ ← ↓ →` | primer tramo más corto |
| d | `→ → ↓ ← ↓ ←` | último tramo hacia el otro lado |

### A2 — Repetir N veces (3 ítems)

#### A2.1 · laberinto · S
Consigna: *Llevá al robot hasta la base.*

```
R ─ · ─ · ─ ·   ·   ·
│           │
·   ·   ·   ·   ·   ·
│           │
· ─ ·   ·   · ─ · ─ B
```
Caminos: fila 1: (1,1)-(2,1)-(3,1)-(4,1); columna 4: (4,1)-(4,2)-(4,3); fila 3: (4,3)-(5,3)-(6,3); señuelos: (1,1)-(1,2)-(1,3)-(2,3). Base en (6,3).

| Opción | Programa | Resultado |
|---|---|---|
| **a ✓** | `repetir 3 veces { → }` `repetir 2 veces { ↓ }` `repetir 2 veces { → }` | llega |
| b | `repetir 2 veces { → }` `repetir 2 veces { ↓ }` `repetir 3 veces { → }` | se choca: no hay camino abajo en (3,1) |
| c | `repetir 3 veces { → }` `repetir 3 veces { ↓ }` `repetir 2 veces { → }` | se cae del mapa |
| d | `repetir 3 veces { → }` `repetir 2 veces { ↓ }` `repetir 3 veces { → }` | se pasa de largo |

Distractores: contar mal en cada uno de los tres bucles (uno de menos, uno de más).

#### A2.2 · lienzo · C
Consigna: *Completá el programa para que dibuje esta figura.*

```
S ━ · ━ · ━ · ━ ·
                ┃
                ·
                ┃
· ━ · ━ · ━ · ━ ·
```
Programa:
```
repetir 4 veces { → }
[ ? ]
repetir 4 veces { ← }
```

| Opción | Pieza | Resultado |
|---|---|---|
| **a ✓** | `repetir 2 veces { ↓ }` | la figura |
| b | `repetir 3 veces { ↓ }` | lado vertical demasiado largo |
| c | `repetir 2 veces { ↑ }` | sube en vez de bajar |
| d | `↓` | lado vertical de una sola casilla |

#### A2.3 · laberinto · D
Consigna: *Este programa hace que el robot se choque. ¿Cuál es el programa arreglado?*

```
R ─ · ─ · ─ · ─ ·
        │       │
·   ·   ·   ·   ·
        │
·   ·   · ─ · ─ B
```
Caminos: fila 1 completa (1,1)…(5,1); columna 3: (3,1)-(3,2)-(3,3); fila 3: (3,3)-(4,3)-(5,3); señuelo: (5,1)-(5,2). Base en (5,3).

Programa con error:
```
repetir 3 veces { → }      ← el robot queda en (4,1) y abajo hay pared
repetir 2 veces { ↓ }
repetir 2 veces { → }
```

| Opción | Cambio (resaltado en la app) | Resultado |
|---|---|---|
| **a ✓** | primer repetir: 3 → **2** | llega |
| b | segundo repetir: 2 → **3** | sigue chocando en (4,1) |
| c | tercer repetir: 2 → **1** | sigue chocando en (4,1) |
| d | cambiar `↓` por `↑` | se cae del mapa |

### A3 — Repetir hasta / mientras (3 ítems)

#### A3.1 · laberinto · S
Consigna: *Llevá al robot hasta la base.*

```
R ─ ·   · ─ ·
│   │
· ─ · ─ ·   ·
        │
·   ·   · ─ ·
            │
·   ·   ·   B
```
Caminos: (1,1)-(2,1), (2,1)-(2,2), (2,2)-(3,2), (3,2)-(3,3), (3,3)-(4,3), (4,3)-(4,4); señuelos: (1,1)-(1,2), (1,2)-(2,2), (3,1)-(4,1). Base en (4,4).

| Opción | Programa | Resultado |
|---|---|---|
| **a ✓** | `repetir hasta llegar a la base { → ↓ }` | llega en 3 vueltas |
| b | `repetir hasta llegar a la base { ↓ → }` | se choca en (2,2): no hay camino abajo |
| c | `repetir 2 veces { → ↓ }` | termina en (3,3) |
| d | `repetir hasta llegar a la base { → → ↓ }` | se choca: no hay camino de (2,1) a (3,1) |

#### A3.2 · laberinto · C
Consigna: *Completá el programa para que el robot llegue a la base.*

```
R ─ · ─ · ─ ·   ·
            │
·   ·   ·   ·   ·
            │
·   ·   ·   B   ·
            │
·   ·   ·   ·   ·
```
Caminos: fila 1: (1,1)…(4,1); columna 4: (4,1)-(4,2)-(4,3)-(4,4). Base en (4,3). El camino sigue una casilla más abajo de la base a propósito.

Programa:
```
mientras haya camino → { → }
[ ? ]
```

| Opción | Pieza | Resultado |
|---|---|---|
| **a ✓** | `repetir 2 veces { ↓ }` | llega |
| b | `mientras haya camino ↓ { ↓ }` | se pasa de largo hasta (4,4) |
| c | `↓` | termina una casilla antes |
| d | `repetir 3 veces { ↓ }` | se pasa de largo |

Distractor b es el importante: mide si entienden que `mientras` sigue hasta que no puede más.

#### A3.3 · laberinto · D
Consigna: *Este programa hace que el robot se choque. ¿Cuál es el programa arreglado?*

```
R ─ · ─ ·   ·   ·
│       │
· ─ ·   · ─ · ─ ·
                │
·   ·   ·   ·   B
```
Caminos: (1,1)-(2,1)-(3,1), (3,1)-(3,2), (3,2)-(4,2)-(5,2), (5,2)-(5,3); señuelos: (1,1)-(1,2), (1,2)-(2,2). Base en (5,3).

Programa con error:
```
repetir hasta llegar a la base { → ↓ }   ← en (2,1) no hay camino abajo
```

| Opción | Programa corregido | Resultado |
|---|---|---|
| **a ✓** | `repetir hasta llegar a la base { → → ↓ }` | llega en 2 vueltas |
| b | `repetir hasta llegar a la base { → ↑ }` | se cae del mapa |
| c | `repetir 2 veces { → ↓ }` | sigue chocando |
| d | `repetir hasta llegar a la base { ↓ → }` | baja a (1,2), pasa a (2,2) y se choca |

---

### A4 — Bucles anidados (3 ítems) · diseño

- **A4.1 · lienzo · S.** Figura: escalera de 3 escalones, cada uno 2 a la derecha y 1 arriba. Correcta: `repetir 3 veces { repetir 2 veces { → } ↑ }`. Distractores: bucles intercambiados `repetir 2 veces { repetir 3 veces { → } ↑ }`; sin anidar `repetir 3 veces { → ↑ }`; secuencial `repetir 6 veces { → } repetir 3 veces { ↑ }`.
- **A4.2 · laberinto · C.** Laberinto "peine": bajar 2, derecha, subir 2, derecha, dos veces (grilla 5×3, base en (5,1)). Programa: `repetir 2 veces { [ ? ] → repetir 2 veces { ↑ } → }`. Correcta: `repetir 2 veces { ↓ }`. Distractores: `repetir 2 veces { ↑ }`, `↓`, `repetir 3 veces { ↓ }`.
- **A4.3 · lienzo · D.** Figura: 3 escalones de 1 a la derecha y 2 arriba. Programa con error: `repetir 3 veces { repetir 2 veces { → } ↑ }` (dibuja escalones al revés). Correcta: `repetir 3 veces { → repetir 2 veces { ↑ } }`. Distractores: cambiar 3 por 2 afuera; cambiar 2 por 3 adentro; sacar el bucle interno.

### A5 — Si (condicional simple) (3 ítems) · diseño

Grillas de 6×3 con todos los caminos salvo los indicados; rocas como obstáculo; el patrón es "si hay roca a la derecha, bajo; después avanzo".

- **A5.1 · laberinto · S.** Robot (1,1), base (6,3), rocas (2,1) y (4,2). Correcta: `repetir hasta llegar a la base { si hay roca → { ↓ } → }` (8 pasos). Distractores: chequear después de moverse `{ → si hay roca → { ↓ } }` (se choca con la roca de (2,1)); desvío hacia arriba `{ si hay roca → { ↑ } → }` (se cae del mapa); sin condicional `{ ↓ → }` (se cae del mapa).
- **A5.2 · laberinto · C.** Robot (1,1), base (6,3), rocas (3,1) y (5,2), pared entre (1,2) y (2,2). Programa: `repetir hasta llegar a la base { si [ ? ] { ↓ } → }`. Correcta: `hay roca →`. Distractores: `hay camino ↓` (baja en (1,1) y se choca con la pared), `hay roca ↓` (se choca con la roca de (3,1)), `hay roca ←` (ídem).
- **A5.3 · laberinto · D.** Mismo mapa que A5.1. Programa con error: `repetir hasta llegar a la base { → si hay roca → { ↓ } }` (se choca al primer paso). Correcta: mover el `→` después del `si`. Distractores: cambiar `↓` por `↑`; cambiar la condición a `hay roca ←`; cambiar el bucle por `repetir 6 veces` sin corregir el orden.

### A6 — Si-sino (3 ítems) · diseño

- **A6.1 · laberinto · S.** Laberinto en escalera con paredes: avanzar a la derecha mientras se pueda; cuando no hay camino, bajar. Grilla 5×4, base (5,4). Correcta: `repetir hasta llegar a la base { si hay camino → { → } si no { ↓ } }`. Distractores: `si no { ↑ }` (se cae); `si hay camino ↓ { ↓ } si no { → }` (baja por un callejón sin salida en la columna 1); `{ → ↓ }` sin condicional (se choca).
- **A6.2 · laberinto · C.** Grilla 6×3, robot (1,1), base (6,3), rocas (3,1), (5,2), (2,3). Programa: `repetir hasta llegar a la base { si [ ? ] { ↓ } si no { → } }`. Correcta: `hay roca →`. Distractores: `hay roca ↓`, `hay camino ↓`, `hay camino →` (cada uno se choca o se cae; verificado por trazado).
- **A6.3 · laberinto · D.** Mapa de A6.1. Programa con error: ramas invertidas `{ si hay camino → { ↓ } si no { → } }`. Correcta: intercambiar las ramas. Distractores: cambiar la condición a `hay camino ↓`; `si no { ↑ }`; cambiar el bucle por `repetir 8 veces` sin tocar las ramas.

### A7 — Funciones simples (3 ítems) · diseño

- **A7.1 · lienzo · S.** Programa principal dado: `repetir 3 veces { Paso } → →` y la figura (escalera de 3 escalones de 1×1 y una línea final de 2). ¿Qué definición de `Paso` la dibuja? Correcta: `definir Paso { → ↑ }`. Distractores: `{ ↑ → }` (escalera que arranca subiendo), `{ → → ↑ }`, `{ ↑ ↑ → }`.
- **A7.2 · laberinto · C.** `definir Bajar { ↓ → }`. Programa: `Bajar [ ? ] Bajar`. Grilla 5×4 con pared entre (2,2) y (2,3); base (4,4). Correcta: `→ ↓`. Distractores: `↓ →` (pared), `Bajar` (pared), `→ →` (termina fuera de la base).
- **A7.3 · lienzo · evaluar equivalencia (el más difícil de la Parte A).** `definir Cuadro { → ↓ ← ↑ }`; programa: `repetir 2 veces { Cuadro → }`. Figura: dos cuadraditos pegados. ¿Cuál programa **sin función** dibuja lo mismo? Correcta: `repetir 2 veces { → ↓ ← ↑ → }`. Distractores: `→ ↓ ← ↑ → ↓ ← ↑` (un solo cuadrado, pintado dos veces), `repetir 2 veces { → ↓ ← ↑ } →` (un cuadrado con una cola), `→ → ↓ ← ← ↑` (un rectángulo sin la línea del medio).

---

## Parte B — "Desafíos de lógica" (8 ítems, sin código) · diseño

| # | Práctica | Ítem | Correcta | Distractores |
|---|---|---|---|---|
| B1 | Descomposición y dependencias | *Pintar la pared*: mover muebles (10 min), tapar el piso (5 min), pintar (30 min). Dos robots trabajan a la vez, pero pintar solo puede empezar cuando las otras dos tareas terminaron. ¿Cuál es el menor tiempo total? | 40 | 45 (todo en serie), 35, 30 |
| B2 | Patrones | *El collar*: ● ● ▲ ● ● ▲ ● ● ▲ … ¿Qué instrucción lo genera? | `repetir { ● ● ▲ }` | `repetir { ● ▲ ● }`, `repetir { ● ▲ }`, `repetir { ● ● ▲ ▲ }` |
| B3 | Patrones y abstracción (compresión) | *Mensajes cortos*: AAABBBBCC se escribe 3A4B2C. ¿Cómo se escribe RRRRRVVVAA? | 5R3V2A | 4R3V2A, 5R2V3A, R5V3A2 |
| B4 | Representación de datos (binario) | *Tarjetas de puntos* (1, 2, 4, 8). Ejemplo: 5 = tarjetas 4 y 1. ¿Qué tarjetas forman 11? | 8, 2, 1 | 8 y 4; 4, 2, 1; 8, 4, 1 |
| B5 | Abstracción (grafo) | *El mapa del barrio*: nodos escuela, plaza y 3 esquinas con distancias. ¿Cuál es el camino más corto de la escuela a la plaza? | ruta de 5 | rutas de 6, 7 y 8 |
| B6 | Seguir un algoritmo | *Robots en fila* con números 3 1 4 2. Regla: mirar dos vecinos; si el de la izquierda es mayor, intercambiarlos; avanzar uno. Después de una pasada, ¿cómo quedan? | 1 3 2 4 | 1 2 3 4 (ordenado del todo), 3 1 2 4, 1 3 4 2 |
| B7 | Evaluar y generalizar | *Las luces*: fila de 6 luces, algunas prendidas. ¿Qué instrucción las apaga todas sin importar cuáles estén prendidas? | "avanzar; si la luz está prendida, apretar el botón" | "avanzar y apretar el botón en cada luz" (prende las apagadas), "apretar el botón 6 veces", "avanzar hasta el final" |
| B8 | Lógica (y / o / no) | *La puerta*: se abre si el robot tiene la llave **o** la luz está verde, pero **no** si lleva una gema. ¿En cuál situación se abre? | llave, luz roja, sin gema | sin llave, verde, con gema; sin llave, roja, sin gema; llave, verde, con gema |

---

## Cobertura final

- Parte A: 7 conceptos × (S, C, D) salvo secuencias (S, S). 20 ítems, 10 laberinto / 6 lienzo / 4 mixtos según diseño final.
- Parte B: descomposición 1, patrones 2, representación y abstracción 2, seguir y evaluar 2, lógica 1.
- Dificultad esperada creciente en A; B intercalada media. Objetivo tras el piloto: dificultad media 0,55 a 0,65, ítems entre 0,25 y 0,90, discriminación > 0,20, alfa > 0,75.
