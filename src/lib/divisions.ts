// Cursos (divisiones) de cada colegio: por ejemplo N, F y S, o A, B y C. Son los mismos para 4.º, 5.º y 6.º.
// Se guardan en schools.divisions como lista separada por comas ("N,F,S").

/** Lee la lista escrita en el panel ("A, B, C" o "N F S"): letras en mayúscula, sin repetir. */
export function parseDivisions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/[\s,;/]+/)) {
    const d = part.trim().toUpperCase().slice(0, 8);
    if (d && !out.includes(d)) out.push(d);
  }
  return out.slice(0, 12);
}

/** "6.º S" o, sin curso, "6.º". */
export function courseLabel(grade: string, division: string | null | undefined): string {
  return division ? `${grade}.º ${division}` : `${grade}.º`;
}
