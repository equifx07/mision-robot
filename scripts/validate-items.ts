// Verifica que cada ítem de la Parte A tenga exactamente una opción que cumple la misión,
// y que sea la marcada como correcta. Uso: npm run validate
import { ITEMS_A } from "../src/lib/items-a";
import { ITEMS_B } from "../src/lib/items-b";
import { simulateOption } from "../src/lib/sim";
import { fixRows } from "../src/lib/fixes";

let problems = 0;
const letters = ["a", "b", "c", "d"];

for (const item of ITEMS_A) {
  const results = item.options.map((opt) => simulateOption(item, opt));
  const okIdx = results.map((r, i) => (r.ok ? i : -1)).filter((i) => i >= 0);
  const good = okIdx.length === 1 && okIdx[0] === item.correct;
  if (!good) problems++;
  console.log(`${good ? "OK " : "!! "} ${item.id.padEnd(5)} ${item.concept.padEnd(11)} ${item.task}  correcta=${letters[item.correct]}  cumplen=[${okIdx.map((i) => letters[i]).join(",")}]`);
  results.forEach((r, i) => console.log(`       ${letters[i]}) ${r.ok ? "✓" : "✗"} ${r.status.padEnd(13)} ${r.detail}`));
  // Arreglar: cada opción tiene que señalar un bloque que exista en el programa dado.
  item.options.forEach((opt, i) => {
    if (opt.kind === "fix" && (!item.given || !fixRows(item.given, opt.from))) {
      problems++;
      console.log(`       !! ${letters[i]}) el pedazo a cambiar no aparece en el programa dado`);
    }
  });
  if (item.options.length !== 4) {
    problems++;
    console.log(`       !! tiene ${item.options.length} opciones`);
  }
}

for (const item of ITEMS_B) {
  const good = item.options.length === 4 && item.correct >= 0 && item.correct < 4;
  if (!good) problems++;
  console.log(`${good ? "OK " : "!! "} ${item.id.padEnd(5)} ${item.practice.padEnd(15)} correcta=${letters[item.correct]}`);
}

console.log(problems === 0 ? "\nTodos los ítems son válidos." : `\n${problems} problema(s) encontrados.`);
process.exit(problems === 0 ? 0 : 1);
