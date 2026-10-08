// Carga y agrega los datos para el panel según filtros. Siempre de UNA prueba (4.º o 6.º), nunca de las dos.
import { listAllAnswers, listAttempts, listSchools, type School } from "./repo";
import { cronbachAlpha, itemAnalysis, scoreAttempts, summarize, type GroupSummary, type ItemStats, type Scored } from "./stats";
import { isGrade, testOf, type Grade, type TestDef } from "./tests";

export type Filters = {
  grade: Grade;
  schoolId?: number;
  priorExp?: string;
  includeUnfinished?: boolean;
};

export type SchoolGroup = { school: School; scored: Scored[]; summary: GroupSummary };

export type DashboardData = {
  filters: Filters;
  test: TestDef;
  schools: School[];
  scored: Scored[];
  summary: GroupSummary;
  bySchool: SchoolGroup[];
  alpha: number;
  alphaA: number;
  items: ItemStats[];
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const grado = one("grado");
  const schoolId = Number(one("colegio"));
  const priorExp = one("exp");
  return {
    grade: isGrade(grado) ? grado : "6",
    schoolId: Number.isInteger(schoolId) && schoolId > 0 ? schoolId : undefined,
    priorExp: priorExp && ["nunca", "algunas", "siempre"].includes(priorExp) ? priorExp : undefined,
    includeUnfinished: one("todos") === "1",
  };
}

/** Pruebas corregidas de un grado (con los filtros de colegio y experiencia). */
export function loadScored(filters: Filters): Scored[] {
  const test = testOf(filters.grade);
  let attempts = listAttempts({ grade: filters.grade, schoolId: filters.schoolId });
  if (!filters.includeUnfinished) attempts = attempts.filter((a) => a.status !== "in_progress");
  if (filters.priorExp) attempts = attempts.filter((a) => a.prior_exp === filters.priorExp);
  return scoreAttempts(test, attempts, listAllAnswers(attempts.map((a) => a.id)));
}

export function loadDashboard(filters: Filters): DashboardData {
  const test = testOf(filters.grade);
  const schools = listSchools();
  const scored = loadScored(filters);
  const summary = summarize(test, scored);
  const bySchool: SchoolGroup[] = schools
    .map((school) => {
      const rows = scored.filter((s) => s.attempt.school_id === school.id);
      return { school, scored: rows, summary: summarize(test, rows) };
    })
    .filter((g) => g.scored.length > 0);
  return {
    filters,
    test,
    schools,
    scored,
    summary,
    bySchool,
    alpha: cronbachAlpha(scored, test.ids),
    alphaA: cronbachAlpha(
      scored,
      test.items.filter((it) => it.part === "A").map((it) => it.id),
    ),
    items: itemAnalysis(test, scored),
  };
}
