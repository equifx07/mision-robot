// Genera pruebas de demostración para probar el panel (o las borra con --clean).
// Uso: npx tsx scripts/seed-demo.ts [--clean] [--n 30]
import { getDb } from "../src/lib/db";
import { ITEMS } from "../src/lib/items";
import { createAttempt, createCourse, createSchool, finishAttempt, listSchools, saveAnswer } from "../src/lib/repo";

const args = process.argv.slice(2);
const clean = args.includes("--clean");
const perCourse = Number(args[args.indexOf("--n") + 1]) || 15;

if (clean) {
  const r = getDb().prepare("DELETE FROM attempts WHERE student_name LIKE 'Demo %'").run();
  console.log(`Borradas ${r.changes} pruebas de demo.`);
  process.exit(0);
}

const DEMO_SCHOOLS: { name: string; ability: number }[] = [
  { name: "Escuela N.º 12 Sarmiento", ability: 0.1 },
  { name: "Colegio San Martín", ability: 0.6 },
  { name: "Instituto Belgrano", ability: -0.3 },
];

let schools = listSchools();
for (const s of DEMO_SCHOOLS) {
  if (!schools.some((x) => x.name === s.name)) createSchool(s.name);
}
schools = listSchools();
for (const s of schools) {
  if (s.courses.length === 0) {
    createCourse(s.id, "6.º A");
    createCourse(s.id, "6.º B");
  }
}
schools = listSchools();

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

let count = 0;
for (const school of schools) {
  const demo = DEMO_SCHOOLS.find((d) => d.name === school.name);
  const schoolAbility = demo?.ability ?? 0;
  for (const course of school.courses) {
    for (let i = 0; i < perCourse; i++) {
      count++;
      const priorExp = (["nunca", "algunas", "siempre"] as const)[Math.floor(Math.random() * 3)];
      const ability = schoolAbility + gauss() * 0.9 + (priorExp === "siempre" ? 0.5 : priorExp === "algunas" ? 0.2 : 0);
      const attempt = createAttempt({
        schoolId: school.id,
        courseId: course.id,
        studentName: `Demo ${String(count).padStart(3, "0")}`,
        age: Math.random() < 0.8 ? 11 : 12,
        priorExp,
        gender: (["femenino", "masculino", "no_dice"] as const)[Math.floor(Math.random() * 3)],
        device: "chromebook",
        screen: "1366x768",
      });
      ITEMS.forEach((item, idx) => {
        // dificultad creciente en la parte A; parte B media
        const difficulty = item.part === "A" ? -1.2 + (idx / 19) * 2.6 : 0.2 + gauss() * 0.3;
        const pCorrect = 0.25 + 0.75 * sigmoid(1.4 * (ability - difficulty));
        const correct = Math.random() < pCorrect;
        const chosen = correct ? item.correct : [1, 2, 3][Math.floor(Math.random() * 3)];
        const timeMs = Math.max(4000, Math.round((25 + idx * 1.5 + gauss() * 12) * 1000));
        saveAnswer(attempt.id, item.id, chosen, timeMs, new Date().toISOString(), new Date().toISOString());
      });
      finishAttempt(attempt.id);
      // fecha de inicio ficticia (hace unos días) y duración realista (25 a 45 min)
      const durationMs = Math.round((25 + Math.random() * 20) * 60000);
      const started = new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000 - durationMs);
      getDb()
        .prepare("UPDATE attempts SET started_at = ?, finished_at = ?, total_ms = ? WHERE id = ?")
        .run(started.toISOString(), new Date(started.getTime() + durationMs).toISOString(), durationMs, attempt.id);
    }
  }
}
console.log(`Creadas ${count} pruebas de demo en ${schools.length} colegios.`);
