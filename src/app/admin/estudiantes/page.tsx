import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadDashboard, parseFilters } from "@/lib/dashboard";
import { attentionStatus, loadReference, SIGNAL_LABEL, studentSignals } from "@/lib/patrones";
import { LEVEL_TONE } from "@/lib/semaforo";
import { fmt, levelOf } from "@/lib/stats";
import { C, Chip, PageHeader } from "@/components/admin/ui";
import { FiltersBar } from "../Filters";

export const dynamic = "force-dynamic";

const EXP: Record<string, string> = { nunca: "Nunca", algunas: "Algunas veces", siempre: "Todos los años" };
const EXP_ORDER: Record<string, number> = { nunca: 0, algunas: 1, siempre: 2 };
const STATUS: Record<string, string> = { finished: "Terminada", timed_out: "Sin tiempo", in_progress: "En curso" };

type Dir = "asc" | "desc";
/** Columnas ordenables: clave en la URL (?orden=), título y sentido del primer clic. */
const COLUMNS: { key: string; label: string; first: Dir }[] = [
  { key: "nombre", label: "Nombre", first: "asc" },
  { key: "colegio", label: "Colegio", first: "asc" },
  { key: "fecha", label: "Fecha", first: "desc" },
  { key: "estado", label: "Estado", first: "asc" },
  { key: "total", label: "Total", first: "desc" },
  { key: "parteA", label: "Parte A", first: "desc" },
  { key: "parteB", label: "Parte B", first: "desc" },
  { key: "nivel", label: "Nivel", first: "desc" },
  { key: "tiempo", label: "Tiempo", first: "desc" },
  { key: "atencion", label: "Atención", first: "desc" },
  { key: "edad", label: "Edad", first: "asc" },
  { key: "exp", label: "Exp. previa", first: "asc" },
  { key: "dispositivo", label: "Dispositivo", first: "asc" },
];

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const d = loadDashboard({ ...filters, includeUnfinished: true });
  const ref = loadReference(d.test);
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const sortKey = COLUMNS.some((c) => c.key === one("orden")) ? one("orden")! : "fecha";
  const dir: Dir = one("dir") === "asc" ? "asc" : one("dir") === "desc" ? "desc" : COLUMNS.find((c) => c.key === sortKey)!.first;

  const rows = d.scored
    .filter((r) => filters.includeUnfinished || r.attempt.status !== "in_progress")
    .map((r) => {
      const a = r.attempt;
      const finished = a.status !== "in_progress";
      const sig = studentSignals(r, ref);
      return { r, a, finished, lv: levelOf(d.test, r.total), sig, att: attentionStatus(sig.signals.length) };
    });

  // Valor de cada fila para la columna elegida; null = sin dato (va siempre al final).
  const text = (s: string | null | undefined) => (s ? s : null);
  const value = (x: (typeof rows)[number]): string | number | null => {
    const { r, a, finished } = x;
    switch (sortKey) {
      case "nombre":
        return a.student_name;
      case "colegio":
        return a.school_name;
      case "fecha":
        return a.started_at;
      case "estado":
        return STATUS[a.status] ?? a.status;
      case "total":
      case "nivel":
        return finished ? r.total : null;
      case "parteA":
        return finished ? (a.score_a ?? 0) : null;
      case "parteB":
        return finished ? (a.score_b ?? 0) : null;
      case "tiempo":
        return a.total_ms ?? null;
      case "atencion":
        return finished ? x.sig.signals.length : null;
      case "edad":
        return a.age ?? null;
      case "exp":
        return a.prior_exp ? EXP_ORDER[a.prior_exp] : null;
      case "dispositivo":
        return text(a.device);
      default:
        return null;
    }
  };
  const sign = dir === "asc" ? 1 : -1;
  rows.sort((x, y) => {
    const vx = value(x);
    const vy = value(y);
    if (vx === null && vy === null) return x.a.student_name.localeCompare(y.a.student_name, "es");
    if (vx === null) return 1;
    if (vy === null) return -1;
    const c = typeof vx === "number" && typeof vy === "number" ? vx - vy : String(vx).localeCompare(String(vy), "es", { sensitivity: "base", numeric: true });
    return c !== 0 ? sign * c : x.a.student_name.localeCompare(y.a.student_name, "es");
  });

  // Enlace de cada título: conserva grado y filtros; el mismo título invierte el sentido.
  const hrefFor = (key: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (k !== "orden" && k !== "dir" && typeof v === "string") p.set(k, v);
    const col = COLUMNS.find((c) => c.key === key)!;
    p.set("orden", key);
    p.set("dir", key === sortKey ? (dir === "asc" ? "desc" : "asc") : col.first);
    return `/admin/estudiantes?${p.toString()}`;
  };

  return (
    <>
      <PageHeader title="Estudiantes" subtitle={`Una fila por prueba de ${d.test.label}. Tocá un título para ordenar y un nombre para ver el detalle misión por misión.`} />
      <FiltersBar filters={filters} schools={d.schools} action="/admin/estudiantes" />
      <div className="overflow-x-auto rounded-[20px] border bg-white" style={{ borderColor: C.line }}>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs font-bold tracking-[0.06em]" style={{ background: "#FAF8F4", color: C.muted }}>
            <tr>
              {COLUMNS.map((c) => {
                const active = c.key === sortKey;
                return (
                  <th key={c.key} className="whitespace-nowrap px-1.5 py-1.5" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                    <Link
                      href={hrefFor(c.key)}
                      scroll={false}
                      className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1.5 no-underline hover:bg-[#EFEBE3] ${active ? "text-[#22211F]" : ""}`}
                      title={`Ordenar por ${c.label.toLowerCase()}`}
                    >
                      {c.label.toUpperCase()}
                      <span aria-hidden className={active ? "" : "opacity-30"}>
                        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, a, finished, lv, sig, att }) => (
              <tr key={a.id} className="border-t hover:bg-[#FAF8F4]" style={{ borderColor: "#F0EDE6" }}>
                <td className="px-3 py-2.5 font-semibold">
                  <Link href={`/admin/estudiantes/${a.id}`} className="text-[#22211F] underline decoration-[#C9C3B6] underline-offset-2 hover:decoration-[#22211F]">
                    {a.student_name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{a.school_name}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{new Date(a.started_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-3 py-2.5">{STATUS[a.status] ?? a.status}</td>
                <td className="px-3 py-2.5 font-semibold tabular-nums">{finished ? `${r.total}/${d.test.max}` : "–"}</td>
                <td className="px-3 py-2.5 tabular-nums">{finished ? `${a.score_a ?? 0}/${d.test.partA}` : "–"}</td>
                <td className="px-3 py-2.5 tabular-nums">{finished ? `${a.score_b ?? 0}/${d.test.partB}` : "–"}</td>
                <td className="px-3 py-2.5">{finished ? <Chip tone={LEVEL_TONE[lv.key]}>{lv.name}</Chip> : "–"}</td>
                <td className="px-3 py-2.5 tabular-nums">{a.total_ms ? `${fmt(a.total_ms / 60000, 0)} min` : "–"}</td>
                <td className="px-3 py-2.5" title={sig.signals.map((k) => SIGNAL_LABEL[k]).join(", ") || "Sin señales de desatención"}>
                  {finished ? <Chip tone={att.tone}>{att.label}</Chip> : "–"}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{a.age ?? "–"}</td>
                <td className="px-3 py-2.5">{a.prior_exp ? EXP[a.prior_exp] : "–"}</td>
                <td className="px-3 py-2.5">{a.device ?? "–"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-6 text-center" style={{ color: C.secondary }}>
                  No hay pruebas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs" style={{ color: C.muted }}>
        {rows.length} {rows.length === 1 ? "prueba" : "pruebas"}.
      </p>
    </>
  );
}
