// Carga y agrega los datos para el panel según filtros.
import { listAllAnswers, listAttempts, listSchools, type AttemptRow, type School } from "./repo";
import { cronbachAlpha, itemAnalysis, scoreAttempts, summarize, type GroupSummary, type ItemStats, type Scored } from "./stats";

export type Filters = {
  schoolId?: number;
  courseId?: number;
  priorExp?: string;
  includeUnfinished?: boolean;
};

export type SchoolGroup = { school: School; scored: Scored[]; summary: GroupSummary };

export type DashboardData = {
  filters: Filters;
  schools: School[];
  attempts: AttemptRow[];
  scored: Scored[];
  summary: GroupSummary;
  bySchool: SchoolGroup[];
  byCourse: { label: string; scored: Scored[]; summary: GroupSummary }[];
  alpha: number;
  alphaA: number;
  items: ItemStats[];
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const schoolId = Number(one("colegio"));
  const courseId = Number(one("curso"));
  const priorExp = one("exp");
  return {
    schoolId: Number.isInteger(schoolId) && schoolId > 0 ? schoolId : undefined,
    courseId: Number.isInteger(courseId) && courseId > 0 ? courseId : undefined,
    priorExp: priorExp && ["nunca", "algunas", "siempre"].includes(priorExp) ? priorExp : undefined,
    includeUnfinished: one("todos") === "1",
  };
}

export function loadDashboard(filters: Filters): DashboardData {
  const schools = listSchools();
  let attempts = listAttempts({ schoolId: filters.schoolId, courseId: filters.courseId });
  if (!filters.includeUnfinished) attempts = attempts.filter((a) => a.status !== "in_progress");
  if (filters.priorExp) attempts = attempts.filter((a) => a.prior_exp === filters.priorExp);
  const answers = listAllAnswers(attempts.map((a) => a.id));
  const scored = scoreAttempts(attempts, answers);
  const summary = summarize(scored);
  const bySchool: SchoolGroup[] = schools
    .map((school) => {
      const rows = scored.filter((s) => s.attempt.school_id === school.id);
      return { school, scored: rows, summary: summarize(rows) };
    })
    .filter((g) => g.scored.length > 0);
  const courseMap = new Map<string, Scored[]>();
  for (const s of scored) {
    const key = `${s.attempt.school_name} · ${s.attempt.course_name}`;
    courseMap.set(key, [...(courseMap.get(key) ?? []), s]);
  }
  const byCourse = [...courseMap.entries()].map(([label, rows]) => ({ label, scored: rows, summary: summarize(rows) }));
  return {
    filters,
    schools,
    attempts,
    scored,
    summary,
    bySchool,
    byCourse,
    alpha: cronbachAlpha(scored),
    alphaA: cronbachAlpha(
      scored,
      scored.length ? Object.keys(scored[0].correct).filter((id) => id.startsWith("A")) : [],
    ),
    items: itemAnalysis(scored),
  };
}
