# Misión Robot · EPC-6

Webapp para evaluar **pensamiento computacional en 6.º grado** (11 a 12 años) y comparar resultados entre colegios.

- **Estudiantes**: entran con nombre, colegio y curso, ven un tutorial con ejemplos animados y resuelven 28 misiones (20 de programar al robot + 8 desafíos de lógica) en hasta 45 minutos. Cada respuesta se guarda al instante con su tiempo.
- **Administrador**: un solo usuario con contraseña. Panel con resumen, comparación entre colegios (medias con intervalo de confianza, distribución, niveles, tamaño del efecto, mapas de calor por dimensión e ítem), lista y detalle de estudiantes, análisis psicométrico de ítems y exportación a CSV.

El diseño del instrumento está documentado en `docs/` (análisis de referencias, banco de ítems y decisiones).

## Desarrollo local

Requiere Node 22.13 o superior (usa el módulo nativo `node:sqlite`).

```bash
npm install
npm run dev
```

- Prueba: http://localhost:3000
- Panel: http://localhost:3000/admin (contraseña de desarrollo: `admin1234`, o la que pongas en `ADMIN_PASSWORD`)
- Revisión de ítems: http://localhost:3000/preview

Comandos útiles:

```bash
npm run validate                    # verifica que cada ítem tenga exactamente una opción correcta
npx tsx scripts/seed-demo.ts --n 12 # crea pruebas de demostración (nombres "Demo NNN")
npx tsx scripts/seed-demo.ts --clean # las borra
```

La base de datos es un archivo SQLite en `data/mision-robot.db` (se crea solo).

## Producción

La app está desplegada en **https://pensamientocomputacional.becode.com.ar** (Coolify, proyecto "Pensamiento Computacional", aplicación `mision-robot`, volumen persistente en `/app/data`). Cada `git push` a `main` dispara un deploy automático mediante el webhook de GitHub; también se puede lanzar desde Coolify con "Deploy". La contraseña del panel se cambia en Coolify, en las variables de entorno de la aplicación (`ADMIN_PASSWORD`), y después "Restart".

## Despliegue en Coolify desde cero

1. En Coolify: **New resource → Application → GitHub** (o "Public/Private repository") y elegí este repositorio, rama `main`.
2. **Build pack: Dockerfile** (el repo incluye el `Dockerfile`). Puerto expuesto: `3000`.
3. **Environment variables**:
   - `ADMIN_PASSWORD`: contraseña del panel (larga y difícil).
   - `ADMIN_SECRET`: cualquier texto aleatorio largo (opcional pero recomendado).
4. **Persistent storage**: agregá un volumen montado en `/app/data`. Ahí vive la base de datos; sin el volumen, cada redeploy borra los resultados.
5. **Domain**: el subdominio que quieras (Coolify genera el certificado HTTPS). Guardá y **Deploy**.
6. Entrá a `https://tu-dominio/admin`, cargá los colegios y cursos, y listo para tomar la prueba.

Backup: copiá el archivo `mision-robot.db` del volumen (por ejemplo, desde la terminal de Coolify) o exportá los CSV desde el panel.

## Estructura

```
src/lib/model.ts        tipos de ítems, bloques y mapas
src/lib/items-a.ts      banco Parte A (robot)
src/lib/items-b.ts      banco Parte B (lógica)
src/lib/sim.ts          simulador del robot (valida ítems y anima el tutorial)
src/lib/tutorial.ts     tutorial y prácticas por bloque
src/lib/db.ts, repo.ts  SQLite y operaciones
src/lib/stats.ts        estadísticas y psicometría
src/components/         mapa, bloques, ítem, runner, gráficos
src/app/                pantalla inicial, prueba, panel /admin, API
scripts/                validación de ítems y datos de demo
docs/                   diseño del instrumento
```
