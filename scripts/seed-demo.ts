// Genera pruebas de demostración en la base local, de 4.º y de 6.º (o las borra con --clean).
// Uso: npx tsx scripts/seed-demo.ts [--clean] [--n 30]
import { deleteDemo, generateDemo } from "../src/lib/demo";
import { createSchool, listSchools } from "../src/lib/repo";
import { GRADES } from "../src/lib/tests";

const args = process.argv.slice(2);
const clean = args.includes("--clean");
const count = Number(args[args.indexOf("--n") + 1]) || 30;

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

let total = 0;
for (const s of listSchools()) {
  const demo = DEMO_SCHOOLS.find((d) => d.name === s.name);
  if (!demo) continue;
  for (const grade of GRADES) total += generateDemo({ schoolId: s.id, grade, count, abilityShift: demo.ability }).created;
}
console.log(`Creadas ${total} pruebas de demo (4.º y 6.º) en ${DEMO_SCHOOLS.length} colegios.`);
process.exit(0);
