# Errores, atención y tiempos

Mediciones agregadas al panel (páginas **Errores y atención** y **Tiempos**). Código: `src/lib/patrones.ts`.

## Por qué hace falta

Todos los chicos hacen las 28 misiones en el mismo orden. Con un orden fijo, la dificultad propia de una misión y el cansancio de estar al final quedan mezclados. Para separarlos se usan los tiempos de respuesta, que ya se guardaban misión por misión.

## Respuesta apurada

Una respuesta es apurada si el chico tardó menos de la décima parte del tiempo típico de esa misión (la mediana de todas las pruebas), con un mínimo de 3 s y un máximo de 10 s. Es el umbral normativo NT10 (Wise y Ma, 2012). En ese tiempo no alcanza para leer la misión.

Para comprobar que el umbral funciona, se mira cuánto aciertan las respuestas apuradas: si fueran al azar, acertarían cerca del 25% (hay 4 opciones).

## Patrón de errores por misión

- **Errores:** respuestas incorrectas sobre los chicos que respondieron. Los que no llegaron porque se terminó el tiempo se cuentan aparte.
- **Línea esperada:** el promedio de errores de las vecinas (hasta 2 antes y 2 después, de la misma parte). Se calcula con el grupo filtrado, así un colegio que rinde menos en general no ve todas sus misiones fuera de la línea.
- **Diagnóstico de cada misión:**
  - **Más difícil que la línea:** tiene 15 puntos o más de errores que la línea, la diferencia es significativa (z ≥ 1,96) y el salto se mantiene entre las respuestas con tiempo normal.
  - **Errores por apuro:** el salto desaparece al sacar las respuestas apuradas, o 3 de cada 10 errores o más son apurados (con al menos 10% de respuestas apuradas en la misión). El segundo criterio hace falta porque el cansancio crece de a poco: sube también la línea de las vecinas y no aparece como salto.
  - **Más fácil que la línea:** tiene 15 puntos o menos de errores que la línea, y la diferencia es significativa.
  - **Sigue la línea:** todo lo demás.
  - Hacen falta al menos 5 respuestas para diagnosticar una misión.

## Señales de atención por chico

| Señal | Criterio |
| --- | --- |
| Respuestas apuradas | 3 o más. |
| Rinde menos al final | Ventaja sobre el resto (acierto del chico menos acierto de referencia de cada misión) en las misiones 1–9, menos la misma ventaja en las misiones 20–28. Cuenta como señal si es de 0,40 o más. |
| Se apuró al final | Ritmo relativo (tiempo del chico sobre el tiempo típico de la misión), comparando la mediana en las misiones 20–28 con la de las misiones 1–9. Cuenta como señal si es de 0,5 o menos. |

Una señal sola puede ser casualidad. Con 2 o más, el puntaje del chico probablemente subestima lo que sabe.

## Tiempos

- **Tiempo de una misión:** desde que aparece hasta que el chico toca Confirmar, sin la explicación ni la práctica previa. Desde esta versión, si el chico recarga la página, el tiempo sigue contando desde la primera aparición; se guarda en el navegador.
- **Prueba completa:** desde que empieza hasta que termina o se acaba el tiempo.
- **Resolviendo misiones:** la suma de los tiempos de las misiones.
- **Explicación y prácticas:** aproximada, es la diferencia entre la prueba completa y el tiempo resolviendo misiones.
- Se usan medianas y rangos intercuartiles.

## Exportación

- `estudiantes.csv` suma estas columnas: `tiempo_misiones_min`, `respuestas_apuradas`, `caida_final`, `ritmo_final_vs_inicio` y `senales_atencion`.
- `respuestas.csv` suma `tiempo_tipico_s` y `apurada`.

## Limitaciones

- Son indicios, no pruebas. Para separar del todo la dificultad del cansancio habría que cambiar el orden de las misiones entre chicos.
- Con menos de 30 chicos, los diagnósticos son orientativos.
