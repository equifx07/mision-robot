# Evaluación de Pensamiento Computacional para 6.º grado — Análisis de referencias y propuesta de prueba

Fecha: 2026-09-25. Estado: borrador para aprobación.

Población objetivo: estudiantes de 6.º grado de primaria (11 a 12 años), varios colegios. Objetivo principal del instrumento: medir la habilidad de pensamiento computacional (PC) de cada estudiante de forma comparable entre colegios.

---

## 1. Qué dice cada referencia y qué nos aporta

### 1.1 Zapata-Cáceres, Martín-Barroso y Román-González (2020). *Computational Thinking Test for Beginners: Design and Content Validation* (EDUCON, IEEE) — archivo `vani.pdf`

Es la fuente central. Describe el diseño y validación del **BCTt (Beginners Computational Thinking Test)**, derivado del **CTt** de Román-González.

- **Marco teórico**: usan el marco tridimensional de Brennan y Resnick (2012): *conceptos* computacionales (secuencias, bucles, condicionales…), *prácticas* (iterar, depurar, abstraer, modularizar) y *perspectivas* (expresarse, conectar, cuestionar). El CTt y el BCTt miden conceptos, parcialmente prácticas, y no miden perspectivas. Por eso recomiendan usarlos "en paralelo con otras herramientas" (sistema de evaluaciones).
- **Instrumento independiente de cualquier entorno de programación** (stand-alone). No requiere haber programado nunca. Esto es lo que lo hace comparable entre poblaciones distintas.
- **Formato**: 25 ítems de opción múltiple, 40 minutos, dos tipos de pantalla: *laberinto* (grilla cuadrada donde hay que llevar al pollito hasta la gallina) y *lienzo* ("seguir la línea punteada", dibujar una figura ejecutando instrucciones). Los ítems van en dificultad creciente y agrupados por concepto: secuencias (6), bucles simples (5), bucles anidados (7), condicionales si / si-sino / mientras (7).
- **Diseño gráfico**: mínimo texto, símbolos autoexplicativos, personaje con conexión emocional (pollito y gallina), obstáculos a evitar (gato) y objetos a recoger (flor). Respuestas dispuestas como columnas verticales de flechas gruesas (se lee de arriba hacia abajo, como el código).
- **Innovación clave: transiciones entre casillas** (caminos dibujados entre celdas, convirtiendo el laberinto en un diagrama de estados). Esto elimina ambigüedades (movimientos diagonales, cuándo "se llega" a una casilla). Evidencia: en 2.º grado los que tuvieron transiciones puntuaron significativamente más (p = 0,005); en 4.º y 6.º no hubo diferencia ni perjuicio. Conclusión: las transiciones son un andamiaje seguro para incluir.
- **Validación de contenido**: 45 expertos juzgaron dificultad, relevancia y diseño. Mejoras que salieron del juicio de expertos y que adoptamos:
  - **4 alternativas en vez de 3** (baja la probabilidad de acertar al azar y sube la confiabilidad).
  - **Ejemplo explicado de cada tipo de ítem antes de la prueba** (en su caso oral; en una webapp puede ser un tutorial interactivo idéntico para todos).
  - Reglas explícitas ("la casilla del gato no se atraviesa"), objetos sin ambigüedad (reemplazaron el segundo pollito por una flor), reformulación de los ítems de si-sino para que correspondan exactamente al concepto.
  - **Accesibilidad para daltonismo**: cada color va asociado a una forma (triángulo azul, etc.) y la prueba funciona en escala de grises.
- **Administración**: 299 estudiantes de 5 a 12 años, tres colegios, protocolo idéntico en todos, en papel (para que la habilidad con dispositivos no contamine el resultado).
- **Resultados que más nos importan** (6.º grado es justo nuestro público):
  - Media global 19,9/25; en 5.º y 6.º la media fue 21,8 y 21,7 sobre 25 (índice de dificultad medio 0,81). **El test resultó demasiado fácil para 5.º y 6.º**: sin diferencia significativa entre 4.º y 5.º ni entre 5.º y 6.º.
  - Confiabilidad global alfa de Cronbach 0,824, pero **baja con la edad**: 0,83 en 1.º, 0,77 en 4.º, 0,66 en 5.º y 0,66 en 6.º. Los propios autores concluyen que el BCTt apunta a 1.º a 4.º grado y que para 5.º y 6.º hacen falta ítems más difíciles.
  - Por concepto: secuencias y bucles simples están en techo en 5.º y 6.º; **bucles anidados y condicionales** tuvieron bajo éxito en todos los grados. Son los conceptos que discriminan a nuestra edad.
  - Test-retest a 5 semanas: correlación de Spearman 0,93. El instrumento es estable, sirve para pre-test y post-test.

**Implicancia directa**: para 6.º grado no copiamos el BCTt; tomamos su estética y sus mejoras de diseño, pero el nivel de dificultad y la cobertura de conceptos deben ser los del CTt (10 a 16 años).

### 1.2 Diapositivas del seminario de Raspberry Pi (Zapata-Cáceres, 2020) — archivo `vani 2.pdf`

Es la presentación del mismo trabajo. Aportes adicionales al paper:

- Definiciones de PC que adoptan (Shute, Sun y Asbell-Clarke, 2017): "proceso humano de resolución de problemas que requiere pensamiento abstracto"; "habilidades de pensamiento que preceden a la programación". Desgloses habituales: abstracción, descomposición, generalización, iteración, depuración, algoritmos.
- Tipos de evaluación existentes: test tradicional, portfolio, encuesta, entrevista; la mayoría orientada a secundaria y a entornos específicos (Scratch, Alice).
- Conclusiones: recomiendan un **sistema de evaluaciones** que cubra conceptos, prácticas y perspectivas; el BCTt se puede usar como pre/post; mencionan una app (Blue Ant Code) y una nueva versión con Cornell.

### 1.3 CTt de Román-González (base del BCTt; fuente confirmada por búsqueda)

- 28 ítems de opción múltiple (4 opciones), menos de 45 minutos, validado para 10 a 16 años (5.º de primaria a 4.º de secundaria en España). Alfa de Cronbach ≈ 0,79.
- Conceptos, 4 ítems cada uno: direcciones básicas y secuencias; bucles "repetir N veces"; bucles "repetir hasta"; condicional simple; condicional si-sino; mientras; funciones simples.
- Entorno: laberinto (23 ítems) y lienzo (5 ítems). Estilo de respuesta: flechas visuales u opciones en bloques tipo Scratch.
- **Tarea cognitiva requerida**: *secuenciar* (armar el programa completo; 14 ítems), *completar* (falta una pieza del programa) y *depurar* (encontrar el error). Esta tercera dimensión es la que le da profundidad al instrumento y es lo que el BCTt no explota.
- Validez de criterio: correlaciona con razonamiento, habilidad espacial y resolución de problemas.

### 1.4 Raspberry Pi: *Research seminar: computational thinking test* (2020)

Resumen periodístico del mismo seminario. Ideas que refuerza: "hasta que no podemos evaluar algo, no sabemos qué aprendieron los chicos"; el test se usa para que docentes vean el desarrollo en el tiempo y para que investigadores comparen enfoques pedagógicos (pre/post).

### 1.5 Raspberry Pi: *How to evaluate your use of classroom technology with the PICRAT framework*

PICRAT es un marco para reflexionar sobre el uso de tecnología en clase, no sobre PC. Dos ejes:

- Relación del estudiante con la tecnología: **P**asivo (recibe), **I**nteractivo (interactúa con el contenido), **C**reativo (construye).
- Efecto en la práctica docente: **R**eemplaza, **A**mplifica, **T**ransforma.

Hallazgo citado: la tecnología rara vez se usa de forma que los chicos sean creativos. Aplicado a nuestra webapp: el estudiante debe estar al menos en *Interactivo* (tutorial donde ejecuta programas y ve al personaje moverse; ítems donde manipula) y, si agregamos desafíos de construcción de programas, en *Creativo*. Para el docente, el sistema *Amplifica* (tiempos por ítem, recolección automática, comparación entre colegios, análisis de ítems: cosas imposibles en papel) y puede *Transformar* si los tableros cambian decisiones pedagógicas.

### 1.6 Raspberry Pi: *What does "thinking" mean now?* (Grover, 2026)

Entrevista a Shuchi Grover. Puntos aplicables:

- PC sigue siendo "resolución computacional de problemas"; la definición no cambió con la IA generativa, cambió qué habilidades pesan más.
- El **pensamiento crítico / evaluar salidas** se volvió central: juzgar si una solución dada es correcta, detectar errores, decidir cuándo una respuesta no sirve. Para nuestro test: darle peso a ítems de *depurar* y de *evaluar* (¿este programa hace lo que se pide?, ¿cuál de estos programas es equivalente?).
- Las bases de CS siguen siendo necesarias ("no hay IA sin CS"); alfabetización en datos como tejido conectivo. Justifica un par de ítems de representación de información (codificación, patrones en datos).

### 1.7 Gómez Valverde, Guzmán Jiménez y Cárdenas Garro (2025). *Designing a high school computational thinking test using evidence-centered design* (IET; repositorio ULima)

Solo pudimos acceder al resumen (acceso restringido). Aportes:

- Metodología **Evidence-Centered Design (ECD)**: definir primero *afirmaciones* (qué queremos poder decir del estudiante), luego *evidencias* observables, y recién entonces las *tareas* que las provocan. Dos escenarios con 59 ítems en seis preguntas; validación de contenido por expertos (índice 0,76); 100 estudiantes de tres colegios de Lima; análisis factorial confirmatorio bayesiano.
- Constructos: pensamiento algorítmico, pensamiento crítico y resolución de problemas se midieron bien **independientemente de la experiencia previa en programación**; la creatividad no se logró medir bien.
- Implicancia: (a) documentar nuestro modelo afirmación → evidencia → tarea (abajo); (b) no intentar medir creatividad con opción múltiple; (c) el diseño por escenarios (una historia que enmarca varios ítems) es una buena forma de dar contexto sin agregar texto en cada ítem.

---

## 2. Qué se desprende para nuestra prueba (decisiones de diseño)

1. **Nivel CTt, estética BCTt.** Conceptos y dificultad del CTt (incluye "repetir hasta", "mientras" y funciones, que el BCTt no cubre bien), con las mejoras del BCTt: transiciones en la grilla, personaje, 4 opciones, tutorial con ejemplo de cada tipo, forma + color, mínimo texto.
2. **Independiente de entorno y de haber programado.** Todo se explica dentro de la prueba. Se registra igualmente si el estudiante programó antes, como variable de análisis, no de puntaje.
3. **Tres tareas cognitivas cruzadas con los conceptos**: secuenciar, completar, depurar. Es lo que evita el techo que tuvo el BCTt en 6.º y le da profundidad a la medición.
4. **Cubrir prácticas, no solo conceptos**: un bloque corto de desafíos "desenchufados" (estilo Bebras: descomposición, patrones, abstracción, seguir y evaluar algoritmos, representación de datos). Responde a la recomendación explícita de los autores de complementar el CTt/BCTt.
5. **Estandarización total de la aplicación** (misma consigna, mismo tutorial, mismo orden, mismo tiempo) porque el objetivo es comparar colegios. Lo que en papel dependía de la explicación oral del docente, acá lo hace la app de forma idéntica.
6. **El tiempo se registra pero no puntúa.** Cronómetro por ítem invisible o discreto. Puntuar por velocidad mete ansiedad y sesgo de dispositivo; analizar tiempos en el tablero sí aporta (detecta adivinación, compara esfuerzo por ítem entre colegios).
7. **Controlar el sesgo de dispositivo** (el BCTt eligió papel por esto): interfaz de un clic, botones grandes, sin arrastrar en los ítems de opción múltiple, tutorial con práctica, registro del tipo de dispositivo.
8. **Nombre del colegio normalizado** (lista desplegable o código de acceso por colegio/curso). Si el colegio se escribe a mano, la comparación por colegio se rompe con el primer error de tipeo.
9. **Pilotear y depurar ítems con datos**: el tablero calcula dificultad (p), discriminación (correlación punto-biserial) y alfa; los ítems que no discriminan se reemplazan. Objetivo para 6.º: p promedio ≈ 0,55 a 0,65, con ítems entre 0,25 y 0,90.

---

## 3. Modelo de evidencia (ECD) resumido

| Afirmación sobre el estudiante | Evidencia observable | Tarea que la provoca |
|---|---|---|
| Ordena acciones para lograr un objetivo (secuencias) | Elige la única secuencia que lleva al personaje a la meta | Laberinto / lienzo, secuenciar |
| Reconoce repetición y la cuantifica (bucles) | Elige el bucle con el número correcto de repeticiones; detecta un "uno de más / uno de menos" | Secuenciar, completar, depurar |
| Maneja repetición con condición de corte (repetir hasta / mientras) | Elige el programa correcto cuando la cantidad de pasos no es visible de antemano | Laberintos con largo variable |
| Maneja repetición dentro de repetición (bucles anidados) | Interpreta correctamente el bucle interno y el externo (figuras tipo escalera, grillas) | Lienzo y laberinto |
| Aplica reglas condicionales (si / si-sino) | Elige la rama correcta según lo que hay en la casilla; detecta la condición invertida | Ítems con objetos y obstáculos variables |
| Abstrae y reutiliza (funciones) | Identifica qué definición de bloque produce el resultado; reconoce programas equivalentes | Completar y evaluar |
| Depura | Localiza el paso erróneo en un programa dado | Depurar (todos los conceptos) |
| Descompone, generaliza, abstrae, ejecuta y evalúa algoritmos sin notación de código | Resuelve correctamente desafíos de lógica visual | Bloque B (estilo Bebras) |

---

## 4. Tabla de especificaciones (blueprint) propuesta

Total: 28 ítems de opción múltiple (4 opciones, 1 correcta) + 2 desafíos de construcción opcionales. Duración estimada: 40 a 45 minutos incluyendo tutorial.

### Parte A: "Programá al personaje" (20 ítems)

| Bloque | Concepto | Ítems | Tareas (S = secuenciar, C = completar, D = depurar) | Pantalla |
|---|---|---|---|---|
| A1 | Secuencias | 2 | S, S | 1 laberinto, 1 lienzo |
| A2 | Repetir N veces | 3 | S, C, D | laberinto + lienzo |
| A3 | Repetir hasta / mientras | 3 | S, C, D | laberinto |
| A4 | Bucles anidados | 3 | S, C, D | lienzo + laberinto |
| A5 | Si (condicional simple) | 3 | S, C, D | laberinto con objetos |
| A6 | Si-sino | 3 | S, C, D | laberinto con objetos y obstáculos |
| A7 | Funciones simples | 3 | S, C, D (o "evaluar equivalencia") | lienzo + laberinto |

Orden: creciente. Los dos primeros ítems funcionan como anclas fáciles (confianza y detección de respuestas al azar).

### Parte B: "Desafíos de lógica" (8 ítems, sin notación de código)

| Práctica | Ítems | Ejemplo de formato |
|---|---|---|
| Descomposición y planificación | 1 | ordenar sub-tareas, elegir el plan válido |
| Patrones y generalización | 2 | continuar/codificar un patrón, regla que genera una serie |
| Abstracción y representación de datos | 2 | codificación con tarjetas binarias, mapa simplificado |
| Seguir y evaluar un algoritmo | 2 | trazar el estado tras N pasos; elegir qué instrucciones producen un resultado |
| Lógica (condiciones combinadas) | 1 | reglas con "y / o / no" |

### Parte C (opcional, fase 2): "Desafío final" (2 ítems de construcción)

El estudiante arma un programa con una paleta limitada de bloques (por ejemplo, debe usar "repetir" y como máximo 6 bloques) y la app lo ejecuta. Se puntúa automáticamente (llega a la meta sí/no; cantidad de bloques como dato secundario). Es la parte "creativa" en términos de PICRAT y la que más desafía. Requiere un editor de bloques y un simulador; el simulador se necesita de todos modos para el tutorial.

---

## 5. Reglas de diseño de ítems

- **Personaje y mundo**: un personaje neutro para 11 a 12 años (propuestas: robot explorador; perro que busca su hueso; astronauta). Meta, objetos a recoger (por ejemplo, gemas) y obstáculos (por ejemplo, lava o rocas). Sin gato/pollito para no infantilizar.
- **Grilla con transiciones**: caminos dibujados entre celdas; sin camino = pared. Sin diagonales.
- **Movimiento con flechas absolutas** (↑ ↓ ← →) en laberinto y lienzo. Evita mezclar "girar" (rotación relativa) que agrega carga espacial ajena a lo que queremos medir. En lienzo, el personaje deja rastro (lápiz) y se pregunta qué programa dibuja la figura.
- **Programas en columna vertical** con bloques tipo Scratch / Pilas Bloques (familiar en Argentina): flecha, "repetir 3 veces { … }", "repetir hasta llegar a la meta { … }", "si hay gema: recoger", "si hay roca: ↑ sino: →", "definir Escalón = ↑ →".
- **4 opciones**; los distractores se construyen a partir de errores típicos: uno de más / uno de menos en el bucle, rama invertida del condicional, orden invertido, paso faltante, bucle interno y externo intercambiados.
- **Mínimo texto**; vocabulario fijo; íconos consistentes. Reglas del mundo explicadas una sola vez en el tutorial y recordadas con íconos en el encabezado.
- **Forma + color** en todo elemento codificado por color; contraste alto.
- **Orden de opciones aleatorio por estudiante** (se registra); orden de ítems fijo.
- **Sin retroalimentación durante la prueba** (es sumativa; la retroalimentación alteraría la medición). Al final, pantalla de cierre; mostrar o no el puntaje al estudiante es una decisión a tomar.
- **Ítems de práctica no puntuados**: uno por bloque de la Parte A, con ejecución animada de la solución.

---

## 6. Protocolo de aplicación (para que los colegios sean comparables)

- Mismo instrumento, misma versión, mismo tutorial, mismo orden.
- Un dispositivo por estudiante, sin ayuda del docente sobre el contenido, sin celulares, silencio. El docente solo resuelve problemas técnicos.
- Ventana de aplicación acotada (por ejemplo, las mismas dos semanas para todos los colegios).
- Código de acceso por colegio y curso (evita errores de tipeo y accesos indebidos).
- Se registra: dispositivo (tablet/PC), navegador, fecha y hora, tiempo total, tiempo por ítem, orden de opciones mostrado, instancia de evaluación (permite pre/post).
- Indicadores de calidad de datos: tiempo total muy bajo, rachas de la misma opción, ítems sin responder.
- Datos de menores: mínimo indispensable, acceso solo docente, sin nombres en comparaciones agregadas. Considerar Ley 25.326 de protección de datos personales.

---

## 7. Puntuación, niveles y tablero

- 1 punto por ítem. Total 0 a 28 (más 0 a 2 de la Parte C si se implementa).
- Sub-puntajes: por parte, por concepto (A1 a A7), por tarea (secuenciar, completar, depurar), por práctica (Parte B).
- Niveles provisorios (a recalibrar tras el piloto): Inicial 0 a 9; En desarrollo 10 a 16; Logrado 17 a 22; Avanzado 23 a 28.
- Tablero docente:
  - Vista general: n, media, mediana, desvío, distribución (histograma), % por nivel.
  - **Por colegio**: las mismas métricas filtradas; comparación colegio vs colegio y vs total; diferencia de medias con intervalo de confianza y tamaño del efecto (d de Cohen); cajas y bigotes por colegio; radar o barras por concepto y por tarea; mapa de calor colegio × ítem.
  - Tiempos: mediana por ítem y por colegio; tiempo total.
  - Análisis de ítems: dificultad (p), discriminación (punto-biserial), alfa de Cronbach, análisis de distractores, con alertas de ítems a revisar.
  - Lista de estudiantes con detalle ítem por ítem (secundaria, como pidió el usuario).
  - Filtros: colegio, curso, instancia, dispositivo, experiencia previa en programación.

---

## 8. Datos a pedir al estudiante (pantalla inicial)

Obligatorios: nombre, curso/división, colegio (desplegable o vía código). Sugeridos: edad; "¿Tuviste clases de programación o robótica antes? (nunca / algunas veces / sí, todos los años)"; género (opcional, con "prefiero no decir"). Automáticos: fecha, dispositivo, navegador.

---

## 9. Ideas de ítems (borrador para aprobar el estilo)

**A1 Secuencias (laberinto, secuenciar).** Grilla 4×4 con caminos; el robot en la esquina, la gema a tres casillas. Opciones: → → ↓ / → ↓ → / ↓ → → / → → ↑. Solo una respeta las paredes.

**A2 Repetir N veces (lienzo, depurar).** Figura: una línea de 5 casillas hacia la derecha y luego 2 hacia abajo. Programa dado: "repetir 4 veces { → }, repetir 2 veces { ↓ }". Pregunta: ¿qué bloque hay que cambiar para que dibuje la figura? Opciones: cambiar 4 por 5 / cambiar 2 por 3 / cambiar → por ← / no hay error.

**A3 Repetir hasta (laberinto, completar).** Pasillo largo cuyo final no se ve completo. Programa: "repetir hasta llegar a la meta { ___ }". Opciones: → / ↑ / → → / ↓.

**A4 Bucles anidados (lienzo, secuenciar).** Figura de escalera de 3 escalones, cada escalón de 2 casillas. Opciones: "repetir 3 veces { repetir 2 veces { → } ↑ }" (correcta), "repetir 2 veces { repetir 3 veces { → } ↑ }", "repetir 3 veces { → ↑ }", "repetir 6 veces { → } ↑".

**A5 Si (laberinto, secuenciar).** Pasillo de 5 casillas con gemas en la 2.ª y la 4.ª. Opciones combinan "repetir 5 veces { →, si hay gema: recoger }" con variantes que recogen siempre, que recogen antes de moverse, o que no repiten.

**A6 Si-sino (laberinto, depurar).** Camino con rocas: "repetir hasta la meta { si hay roca adelante: ↑ sino: → }". Se muestra un programa con las ramas invertidas y se pregunta cuál es el error.

**A7 Funciones (lienzo, evaluar equivalencia).** "Definir Escalón = → ↑". Programa: "repetir 4 veces { Escalón }". Pregunta: ¿cuál de estos programas sin función dibuja lo mismo? o ¿qué definición de Escalón hace que el programa dibuje esta figura?

**B Patrones.** Collar de cuentas: ● ● ▲ ● ● ▲ ● ● … ¿Cuál de estas "instrucciones" lo genera? "repetir { 2 círculos, 1 triángulo }" vs variantes.

**B Representación.** Tarjetas con 1, 2, 4 y 8 puntos. ¿Qué tarjetas hay que mostrar para formar 11 puntos?

**B Seguir un algoritmo.** Cuatro vasos de distinta altura y una regla ("si el de la izquierda es más alto que el de la derecha, intercambiarlos; avanzar una posición"). ¿Cómo quedan después de una pasada?

**B Descomposición.** Para armar una mesa hay que: atornillar patas, dar vuelta la mesa, apoyar la tapa boca abajo, sacar las piezas de la caja. ¿Cuál orden es válido? (con imágenes, mínimo texto).

**B Lógica.** El robot pasa por la puerta solo si tiene la llave **y** la luz está verde. Se muestran cuatro situaciones; ¿en cuál pasa?

**C Construcción (fase 2).** "Llevá al robot hasta la gema usando como máximo 5 bloques. Tenés que usar un bloque repetir". La app ejecuta el programa armado.

---

## 10. Decisiones pendientes de aprobación

1. Estructura 20 + 8 (+ 2 de construcción en fase 2).
2. Personaje y tema (robot / perro / astronauta u otro).
3. Flechas absolutas (↑ ↓ ← →) en vez de "avanzar / girar".
4. Tiempo: sin límite por ítem, límite global de 45 minutos con indicador discreto, registro silencioso por ítem.
5. Sin retroalimentación durante la prueba; ¿mostrar puntaje al estudiante al final?
6. Datos iniciales: nombre, curso, colegio (por código o desplegable) y las preguntas opcionales (edad, experiencia previa, género).
7. Incluir la Parte B (prácticas, estilo Bebras).
8. Niveles y cortes provisorios.
9. Nombre de la prueba.
