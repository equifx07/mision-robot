// Genera pruebas de demostración en la base local (o las borra con --clean).
// Uso: npx tsx scripts/seed-demo.ts [--clean] [--n 15]
import { deleteDemo, generateDemo } from "../src/lib/demo";
import { createCourse, createSchool, listSchools } from "../src/lib/repo";

const args = process.argv.slice(2);
const clean = args.includes("--clean");
const perCourse = Number(args[args.indexOf("--n") + 1]) || 15;

if (clean) {
  console.log(`Borradas ${deleteDemo()} pruebas de demo.`);
  process.exit(0);
}

const DEMO_SCHOOLS: { name: string; ability: number }[] = [
  { name: "Escuela N.º 12 Sarmiento", ability: 0.1 },
  { name: "Colegio San Martín", ability: 0.6 },
  { name: "Instituto Belgrano", ability: -0.3 },
];

for (const s of DEMO_SCHOOLS) {
  if (!listSchools().some((x) => x.name === s.name)) createSchool(s.name);
}
for (const s of listSchools()) {
  if (s.courses.length === 0) {
    createCourse(s.id, "6.º A");
    createCourse(s.id, "6.º B");
  }
}

let total = 0;
for (const s of listSchools()) {
  const demo = DEMO_SCHOOLS.find((d) => d.name === s.name);
  const r = generateDemo({ schoolId: s.id, perCourse, abilityShift: demo?.ability ?? 0 });
  total += r.created;
}
console.log(`Creadas ${total} pruebas de demo en ${listSchools().length} colegios.`);
