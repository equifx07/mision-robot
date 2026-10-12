# Cuidado de los datos

Desde el 2026-10-12, la regla es que los datos de las pruebas no se pueden perder.

## Dónde están

Están en un archivo SQLite, `DATA_DIR/mision-robot.db`. En producción vive en el volumen persistente de Coolify `…-mision-robot-data`, montado en `/app/data`. El volumen no se borra al redesplegar ni al reiniciar.

**No borrar la aplicación ni el volumen en Coolify.** Eso sí borra los datos.

## Qué protege

| Riesgo | Protección |
| --- | --- |
| Se corta internet en plena prueba | Cada respuesta se guarda al tocar Confirmar. |
| Un cambio del programa en la base | Los cambios de esquema solo agregan tablas o columnas (`db.ts`). Antes de migrar se hace una copia (`backups/…-migracion.db`). Una base vieja no se toca: se avisa. |
| Alguien borra desde el panel | Papelera: borrar marca `deleted_at` y esconde. Se restaura desde Panel › Papelera. Nada se borra de verdad desde el panel. |
| Error del programa o de datos | Copias automáticas en `DATA_DIR/backups` (`backup.ts`): al arrancar y cada hora si hubo cambios. Se guardan todas las de 7 días y una por día hasta 90 días. |
| Falla del servidor o del disco | **Solo una copia fuera del servidor.** Panel › Exportar y copias › "Descargar copia de seguridad". Después de cada toma, bajar una copia y guardarla en otro lado (por ejemplo, Drive). |

## Cómo restaurar desde una copia

1. Bajar la copia (archivo `.db`) desde el panel o tomarla de `/app/data/backups`.
2. Detener la app en Coolify.
3. Reemplazar `/app/data/mision-robot.db` por la copia y borrar los `-wal` y `-shm` que haya al lado.
4. Volver a iniciar la app.
