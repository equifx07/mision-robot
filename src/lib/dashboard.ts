// Carga y agrega los datos para el panel según filtros. Siempre de UNA prueba (4.º o 6.º), nunca de las dos.
import { courseLabel } from "./divisions";
import { listAllAnswers, listAttempts, listSchools, type School } from "./repo";
import { cronbachAlpha, itemAnalysis, scoreAttempts, summarize, type GroupSummary, type ItemStats, type Scored } from "./stats";
import { isGrade, testOf, type Grade, type TestDef } from "./tests";

export type Filters = {
  grade: Grade;
  schoolId?: number;
  /** Curso dentro del colegio elegido (solo junto con schoolId). */
  division?: string;
  priorExp?: string;
  /** Cómo se arman los grupos que se comparan: por colegio (por defecto) o por curso. */
  groupBy?: "colegio" | "curso";
  includeUnfinished?: boolean;
};

export type SchoolGroup = { school: School; scored: Scored[]; summary: GroupSummary };

export type DashboardData = {
  filters: Filters;
  test: TestDef;
  schools: School[];
  scored: Scored[];
  summary: GroupSummary;
  /** Grupos que se comparan: colegios o cursos, según filters.groupBy. */
  bySchool: SchoolGroup[];
  /** Ajusta los textos: con grupos por curso, "colegio" pasa a decir "curso". */
  word: (text: string) => string;
  alpha: number;
  alphaA: number;
  items: ItemStats[];
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const grado = one("grado");
  // colegio=3 (todo el colegio) o colegio=3:S (un curso de ese colegio)
  const [rawSchool, rawDivision] = (one("colegio") ?? "").split(":");
  const schoolId = Number(rawSchool);
  const hasSchool = Number.isInteger(schoolId) && schoolId > 0;
  const priorExp = one("exp");
  return {
    grade: isGrade(grado) ? grado : "6",
    schoolId: hasSchool ? schoolId : undefined,
    division: hasSchool && rawDivision ? rawDivision.toUpperCase().slice(0, 8) : undefined,
    groupBy: one("por") === "curso" ? "curso" : "colegio",
    priorExp: priorExp && ["nunca", "algunas", "siempre"].includes(priorExp) ? priorExp : undefined,
    includeUnfinished: one("todos") === "1",
  };
}

/** Pruebas corregidas de un grado (con los filtros de colegio y experiencia). */
export function loadScored(filters: Filters): Scored[] {
  const test = testOf(filters.grade);
  let attempts = listAttempts({ grade: filters.grade, schoolId: filters.schoolId, division: filters.division });
  if (!filters.includeUnfinished) attempts = attempts.filter((a) => a.status !== "in_progress");
  if (filters.priorExp) attempts = attempts.filter((a) => a.prior_exp === filters.priorExp);
  return scoreAttempts(test, attempts, listAllAnswers(attempts.map((a) => a.id)));
}

export function loadDashboard(filters: Filters): DashboardData {
  const test = testOf(filters.grade);
  const schools = listSchools();
  const scored = loadScored(filters);
  const summary = summarize(test, scored);
  const bySchool: SchoolGroup[] =
    filters.groupBy === "curso"
      ? schools.flatMap((school) => {
          const rows = scored.filter((s) => s.attempt.school_id === school.id);
          // Los cursos cargados, en su orden; después los que aparezcan en los datos y por último "sin curso".
          const keys = [...school.divisions, ...new Set(rows.map((r) => r.attempt.division).filter((x): x is string => !!x && !school.divisions.includes(x)))];
          const all: (string | null)[] = [...keys, null];
          return all
            .map((div) => {
              const part = rows.filter((r) => (r.attempt.division ?? null) === div);
              const course = div ? courseLabel(filters.grade, div) : `${filters.grade}.º sin curso`;
              const name = filters.schoolId ? course : `${school.name} · ${course}`;
              return { school: { id: school.id, name, divisions: [] }, scored: part, summary: summarize(test, part) };
            })
            .filter((g) => g.scored.length > 0);
        })
      : schools
          .map((school) => {
            const rows = scored.filter((s) => s.attempt.school_id === school.id);
            return { school, scored: rows, summary: summarize(test, rows) };
          })
          .filter((g) => g.scored.length > 0);
  // Por curso, el consejo de sacar el filtro de colegio no aplica (los cursos se comparan dentro del colegio).
  const word = (text: string) =>
    filters.groupBy === "curso"
      ? text
          .replace(/ Sacá el filtro de colegio( para comparar)?\./g, "")
          .replace(/\bcolegio(s?)\b/g, "curso$1")
      : text;
  return {
    filters,
    test,
    schools,
    scored,
    summary,
    bySchool,
    word,
    alpha: cronbachAlpha(scored, test.ids),
    alphaA: cronbachAlpha(
      scored,
      test.items.filter((it) => it.part === "A").map((it) => it.id),
    ),
    items: itemAnalysis(test, scored),
  };
}
