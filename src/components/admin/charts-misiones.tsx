// Gráficos con una columna por misión de la prueba (en el orden en que las hacen los chicos), más las cajas
// de minutos y las barras de chicos por cantidad de señales. Se dibujan en el servidor, en HTML.
import type { ReactNode } from "react";
import type { ItemPattern, TimeStats } from "@/lib/patrones";
import { TONES, type Tone } from "@/lib/semaforo";
import { fmt } from "@/lib/stats";
import { C } from "./ui";

const PARTS = [
  { part: "A" as const, label: "Parte A · Programá al robot" },
  { part: "B" as const, label: "Parte B · Lógica" },
];
type Col = { id: string; part: "A" | "B" };
/** Columnas de una parte, con su número de misión dentro de la prueba. */
const colsOf = (all: Col[], part: "A" | "B") => all.map((c, i) => ({ id: c.id, pos: i + 1, part: c.part })).filter((c) => c.part === part);
const partOf = (id: string): "A" | "B" => (id.startsWith("B") ? "B" : "A");
const h = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

/** Gris medio para lo que "sigue la línea": el gris neutro de las etiquetas es muy claro para una barra. */
export const LINE_GRAY = "#A8A196";

/**
 * Marco común: eje vertical, líneas guía, una columna por misión separada en Parte A y Parte B,
 * y debajo los nombres de las misiones. `line`: valores para una línea punteada encima (p. ej. la esperada).
 */
function MissionFrame({
  items,
  height = 220,
  max,
  ticks,
  tick,
  col,
  line,
  footer,
}: {
  items: Col[];
  height?: number;
  max: number;
  ticks: number[];
  tick: (v: number) => string;
  col: (id: string, pos: number) => ReactNode;
  line?: Record<string, number>;
  footer?: { label: string; value: (id: string) => string };
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative w-9 shrink-0" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2 text-[11px] tabular-nums" style={{ bottom: h(t, max), color: C.muted }}>
              {tick(t)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 gap-4">
          {PARTS.map(({ part }) => {
            const cs = colsOf(items, part);
            const pts = line
              ? cs
                  .map((c, i) => ({ x: ((i + 0.5) / cs.length) * 100, v: line[c.id] }))
                  .filter((p) => Number.isFinite(p.v))
                  .map((p) => `${p.x},${100 - Math.min(100, (p.v / max) * 100)}`)
                  .join(" ")
              : "";
            return (
              <div key={part} className="relative flex min-w-0 border-b" style={{ flexGrow: cs.length, flexBasis: 0, height, borderColor: "#C9C3B6" }}>
                {ticks.map((t) => (
                  <div key={t} className="pointer-events-none absolute inset-x-0 border-t" style={{ bottom: h(t, max), borderColor: t === 0 ? "transparent" : "#EFEBE3" }} />
                ))}
                {cs.map((c) => (
                  <div key={c.id} className="relative min-w-0 flex-1 px-[3px]">
                    <div className="relative h-full">{col(c.id, c.pos)}</div>
                  </div>
                ))}
                {pts && (
                  <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <polyline points={pts} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-9 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-4">
          {PARTS.map(({ part, label }) => {
            const cs = colsOf(items, part);
            return (
              <div key={part} className="flex min-w-0 flex-col gap-1" style={{ flexGrow: cs.length, flexBasis: 0 }}>
                <div className="flex">
                  {cs.map((c) => (
                    <span key={c.id} className="min-w-0 flex-1 text-center text-[11px] font-bold tabular-nums">
                      {c.id}
                    </span>
                  ))}
                </div>
                {footer && (
                  <div className="flex">
                    {cs.map((c) => (
                      <span key={c.id} className="min-w-0 flex-1 text-center text-[11px] tabular-nums" style={{ color: C.secondary }}>
                        {footer.value(c.id)}
                      </span>
                    ))}
                  </div>
                )}
                <span className="rounded-md px-2 py-1 text-center text-xs font-semibold" style={{ background: C.soft, color: C.secondary }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {footer && (
        <span className="pl-11 text-xs" style={{ color: C.muted }}>
          Debajo de cada misión: {footer.label}.
        </span>
      )}
    </div>
  );
}

const pctTicks = (max: number) => (max <= 0.2 ? [0, 0.05, 0.1, 0.15, 0.2].filter((t) => t <= max) : max <= 0.5 ? [0, 0.1, 0.2, 0.3, 0.4, 0.5].filter((t) => t <= max) : [0, 0.25, 0.5, 0.75, 1]);
const pctLabel = (v: number) => `${Math.round(v * 100)}%`;

function Swatch({ fill, children, line }: { fill?: string; children: ReactNode; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {line ? (
        <svg width="24" height="4" aria-hidden>
          <line x1="0" y1="2" x2="24" y2="2" stroke={C.ink} strokeWidth="2" strokeDasharray="5 4" />
        </svg>
      ) : (
        <span className="h-3 w-3.5 rounded-sm" style={{ background: fill }} />
      )}
      {children}
    </span>
  );
}

// ───────── Errores por misión con la línea esperada ─────────

const diagFill = (p: ItemPattern) => (p.diagnosis.key === "linea" || p.diagnosis.key === "sin-datos" ? LINE_GRAY : TONES[p.diagnosis.tone].fill);

export function ErrorLineChart({ patterns }: { patterns: ItemPattern[] }) {
  const by = Object.fromEntries(patterns.map((p) => [p.id, p]));
  const line = Object.fromEntries(patterns.map((p) => [p.id, p.expected]));
  return (
    <div className="flex flex-col gap-4">
      <MissionFrame
        items={patterns}
        height={240}
        max={1}
        ticks={pctTicks(1)}
        tick={pctLabel}
        line={line}
        col={(id) => {
          const p = by[id];
          if (!Number.isFinite(p.err)) return null;
          const flagged = p.diagnosis.key !== "linea" && p.diagnosis.key !== "sin-datos";
          return (
            <div
              className="absolute inset-0"
              title={`${id} (misión ${p.pos}): se equivocó el ${pctLabel(p.err)} de los que la respondieron. Línea esperada: ${pctLabel(p.expected)}. ${p.diagnosis.label}.`}
            >
              <div className="absolute inset-x-0 bottom-0 rounded-t" style={{ height: h(p.err, 1), background: diagFill(p) }} />
              <span className="absolute inset-x-0 text-center text-[11px] tabular-nums" style={{ bottom: `calc(${h(p.err, 1)} + 2px)`, fontWeight: flagged ? 800 : 500, color: flagged ? C.ink : C.muted }}>
                {Math.round(p.err * 100)}
              </span>
            </div>
          );
        }}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-11 text-[13px]" style={{ color: C.secondary }}>
        <Swatch fill={TONES.bajo.fill}>Más difícil que la línea</Swatch>
        <Swatch fill={TONES.regular.fill}>Errores por apuro</Swatch>
        <Swatch fill={LINE_GRAY}>Sigue la línea</Swatch>
        <Swatch fill={TONES.bien.fill}>Más fácil que la línea</Swatch>
        <Swatch line>Línea esperada (promedio de las vecinas)</Swatch>
      </div>
    </div>
  );
}

// ───────── Barra apilada: acertó / se equivocó pensando / apurada / no llegó ─────────

export const OUTCOME = [
  { key: "ok", label: "Acertó", fill: TONES.bien.fill, text: TONES.bien.text },
  { key: "wrong", label: "Se equivocó pensando", fill: TONES.bajo.fill, text: TONES.bajo.text },
  { key: "rushed", label: "Contestó apurado", fill: TONES.regular.fill, text: TONES.regular.text },
  { key: "none", label: "No respondió", fill: "#D8D3C8", text: C.ink },
] as const;

export function OutcomeBar({ p }: { p: ItemPattern }) {
  const counts = { ok: p.right - p.rushedRight, wrong: p.wrongCareful, rushed: p.rushed, none: p.noReach };
  const n = p.n || 1;
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-md" style={{ background: C.soft }}>
      {OUTCOME.filter((o) => counts[o.key] > 0).map((o) => {
        const share = counts[o.key] / n;
        return (
          <div
            key={o.key}
            title={`${o.label}: ${counts[o.key]} de ${p.n} (${pctLabel(share)})`}
            className="flex items-center justify-center text-[11px] font-bold"
            style={{ flexGrow: counts[o.key], flexBasis: 0, background: o.fill, color: o.text }}
          >
            {share >= 0.08 ? pctLabel(share) : ""}
          </div>
        );
      })}
    </div>
  );
}

export function OutcomeLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]" style={{ color: C.secondary }}>
      {OUTCOME.map((o) => (
        <Swatch key={o.key} fill={o.fill}>
          {o.label}
        </Swatch>
      ))}
    </div>
  );
}

// ───────── Curva del cansancio: apuradas y no llegó, misión por misión ─────────

export function RushCurve({ patterns }: { patterns: ItemPattern[] }) {
  const by = Object.fromEntries(patterns.map((p) => [p.id, p]));
  const top = Math.max(0.1, ...patterns.map((p) => (p.n ? (p.rushed + p.noReach) / p.n : 0)));
  const max = top <= 0.2 ? 0.2 : top <= 0.5 ? 0.5 : 1;
  return (
    <div className="flex flex-col gap-4">
      <MissionFrame
        items={patterns}
        height={180}
        max={max}
        ticks={pctTicks(max)}
        tick={pctLabel}
        col={(id) => {
          const p = by[id];
          if (!p.n) return null;
          const r = p.rushed / p.n;
          const nr = p.noReach / p.n;
          return (
            <div className="absolute inset-0" title={`${id} (misión ${p.pos}): ${p.rushed} de ${p.n} contestaron apurados y ${p.noReach} no la respondieron.`}>
              <div className="absolute inset-x-0 bottom-0" style={{ height: h(r, max), background: TONES.regular.fill }} />
              <div className="absolute inset-x-0 rounded-t" style={{ bottom: h(r, max), height: h(nr, max), background: "#B9B2A4" }} />
              {r + nr > 0 && (
                <span className="absolute inset-x-0 text-center text-[11px] font-semibold tabular-nums" style={{ bottom: `calc(${h(r + nr, max)} + 2px)`, color: C.secondary }}>
                  {Math.round((r + nr) * 100)}
                </span>
              )}
            </div>
          );
        }}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-11 text-[13px]" style={{ color: C.secondary }}>
        <Swatch fill={TONES.regular.fill}>Contestó apurado</Swatch>
        <Swatch fill="#B9B2A4">No la respondió</Swatch>
      </div>
    </div>
  );
}

// ───────── Tiempo por misión ─────────

const secTicks = (max: number) => {
  const step = max <= 60 ? 15 : max <= 120 ? 30 : 60;
  return Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
};
const roundUp = (v: number) => (v <= 60 ? 60 : v <= 120 ? Math.ceil(v / 30) * 30 : Math.ceil(v / 60) * 60);

export function ItemTimeChart({ times }: { times: { id: string; all: TimeStats }[] }) {
  const by = Object.fromEntries(times.map((t) => [t.id, t.all]));
  const max = roundUp(Math.max(30, ...times.map((t) => (Number.isFinite(t.all.q3) ? t.all.q3 : 0))));
  return (
    <div className="flex flex-col gap-4">
      <MissionFrame
        items={times.map((t) => ({ id: t.id, part: partOf(t.id) }))}
        height={220}
        max={max}
        ticks={secTicks(max)}
        tick={(v) => `${v} s`}
        footer={{ label: "segundos que tardó el chico típico (mediana)", value: (id) => (Number.isFinite(by[id].median) ? fmt(by[id].median, 0) : "–") }}
        col={(id, pos) => {
          const s = by[id];
          if (!s.n) return null;
          return (
            <div className="absolute inset-0" title={`${id} (misión ${pos}): mediana ${fmt(s.median, 0)} s; la mitad central tardó de ${fmt(s.q1, 0)} a ${fmt(s.q3, 0)} s.`}>
              <div className="absolute inset-x-0 bottom-0 rounded-t" style={{ height: h(s.median, max), background: "#B9B2A4" }} />
              <div className="absolute left-1/2 w-0.5 -translate-x-1/2" style={{ bottom: h(s.q1, max), height: h(s.q3 - s.q1, max), background: C.ink }} />
              <div className="absolute left-1/2 h-0.5 w-2.5 -translate-x-1/2" style={{ bottom: h(s.q3, max), background: C.ink }} />
              <div className="absolute left-1/2 h-0.5 w-2.5 -translate-x-1/2" style={{ bottom: h(s.q1, max), background: C.ink }} />
            </div>
          );
        }}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-11 text-[13px]" style={{ color: C.secondary }}>
        <Swatch fill="#B9B2A4">Barra: tiempo típico (mediana)</Swatch>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-0.5" style={{ background: C.ink }} />
          Línea: lo que tardó la mitad central de los chicos
        </span>
      </div>
    </div>
  );
}

/** Tiempo de los que acertaron contra el de los que se equivocaron (sin respuestas apuradas). */
export function RightWrongChart({ times }: { times: { id: string; right: number; wrong: number }[] }) {
  const by = Object.fromEntries(times.map((t) => [t.id, t]));
  const max = roundUp(Math.max(30, ...times.flatMap((t) => [t.right, t.wrong].filter(Number.isFinite))));
  const dot = (v: number, fill: string) => <div className="absolute left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white" style={{ bottom: h(v, max), background: fill }} />;
  return (
    <div className="flex flex-col gap-4">
      <MissionFrame
        items={times.map((t) => ({ id: t.id, part: partOf(t.id) }))}
        height={220}
        max={max}
        ticks={secTicks(max)}
        tick={(v) => `${v} s`}
        col={(id, pos) => {
          const t = by[id];
          const r = Number.isFinite(t.right);
          const w = Number.isFinite(t.wrong);
          if (!r && !w) return null;
          return (
            <div
              className="absolute inset-0"
              title={`${id} (misión ${pos}): los que acertaron tardaron ${r ? fmt(t.right, 0) + " s" : "–"}; los que se equivocaron, ${w ? fmt(t.wrong, 0) + " s" : "–"} (medianas, sin respuestas apuradas).`}
            >
              {r && w && <div className="absolute left-1/2 w-0.5 -translate-x-1/2" style={{ bottom: h(Math.min(t.right, t.wrong), max), height: h(Math.abs(t.right - t.wrong), max), background: "#C9C3B6" }} />}
              {r && dot(t.right, TONES.bien.fill)}
              {w && dot(t.wrong, TONES.bajo.fill)}
            </div>
          );
        }}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-11 text-[13px]" style={{ color: C.secondary }}>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: TONES.bien.fill }} />
          Los que acertaron
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: TONES.bajo.fill }} />
          Los que se equivocaron
        </span>
        <span>Sin contar las respuestas apuradas. Falta un punto si hubo menos de 3 chicos en ese grupo.</span>
      </div>
    </div>
  );
}

// ───────── Minutos de la prueba por colegio ─────────

// Sin límite de tiempo: la escala llega hasta el chico más lento, redondeado a 15 minutos.
const minPos = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

function MiniBox({ s, top, fill, max }: { s: TimeStats; top: number; fill: string; max: number }) {
  if (!s.n) return null;
  const pos = (v: number) => minPos(v, max);
  return (
    <>
      <div className="absolute h-0.5" style={{ top: top + 7, left: pos(s.min), width: pos(s.max - s.min), background: C.ink2 }} />
      <div className="absolute rounded border-2" style={{ top, height: 16, left: pos(s.q1), width: `max(4px, ${pos(s.q3 - s.q1)})`, background: fill, borderColor: C.ink }} />
      <div className="absolute w-[3px]" style={{ top: top - 2, height: 20, left: `calc(${pos(s.median)} - 1px)`, background: C.ink }} />
    </>
  );
}

export function MinutesBoxes({ rows }: { rows: { label: string; sub: string; total: TimeStats; missions: TimeStats }[] }) {
  const top = Math.max(15, ...rows.map((r) => (Number.isFinite(r.total.max) ? r.total.max : 0)));
  const max = Math.ceil(top / 15) * 15;
  const ticks = Array.from({ length: max / 15 + 1 }, (_, i) => i * 15);
  return (
    <div className="flex flex-col">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 border-b" style={{ height: 64, borderColor: "#F0EDE6" }}>
          <div className="flex w-[170px] shrink-0 flex-col">
            <span className="text-[15px] font-bold leading-tight">{r.label}</span>
            <span className="text-[13px]" style={{ color: C.muted }}>
              {r.sub}
            </span>
          </div>
          <div
            className="relative h-full min-w-0 flex-1"
            title={`${r.label}: prueba completa, mediana ${fmt(r.total.median, 0)} min (la mitad central de ${fmt(r.total.q1, 0)} a ${fmt(r.total.q3, 0)}); resolviendo misiones, mediana ${fmt(r.missions.median, 0)} min.`}
          >
            <MiniBox s={r.total} top={12} fill="#8F877A" max={max} />
            <MiniBox s={r.missions} top={36} fill="#DCD7CC" max={max} />
          </div>
          <span className="w-[150px] shrink-0 text-[13px] leading-snug" style={{ color: C.secondary }}>
            completa {fmt(r.total.median, 0)} min
            <br />
            en misiones {fmt(r.missions.median, 0)} min
          </span>
        </div>
      ))}
      <div className="flex gap-3 pt-1.5">
        <span className="w-[170px] shrink-0" />
        <div className="relative h-[18px] min-w-0 flex-1 text-xs" style={{ color: C.muted }}>
          {ticks.map((v) => (
            <span key={v} className={`absolute whitespace-nowrap ${v === max ? "-translate-x-full" : v === 0 ? "" : "-translate-x-1/2"}`} style={{ left: minPos(v, max) }}>
              {v} min
            </span>
          ))}
        </div>
        <span className="w-[150px] shrink-0" />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-[13px]" style={{ color: C.secondary }}>
        <Swatch fill="#8F877A">Prueba completa (con la explicación y las prácticas)</Swatch>
        <Swatch fill="#DCD7CC">Resolviendo misiones</Swatch>
        <span>Caja: la mitad central · raya: la mediana · línea fina: del más rápido al más lento</span>
      </div>
    </div>
  );
}

// ───────── Chicos por cantidad de algo (p. ej. señales de atención) ─────────

export function CountStackRows({ rows, legend }: { rows: { label: string; n: number; parts: { count: number; tone: Tone; label: string }[] }[]; legend: { tone: Tone; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-[170px] shrink-0 text-[15px] font-bold leading-tight">{r.label}</span>
          <div className="flex h-10 min-w-0 flex-1 gap-0.5 overflow-hidden rounded-[10px]">
            {r.parts
              .filter((p) => p.count > 0)
              .map((p) => (
                <div
                  key={p.label}
                  title={`${p.label}: ${p.count} de ${r.n}`}
                  className="flex items-center justify-center text-base font-bold"
                  style={{ flexGrow: p.count, flexBasis: 0, background: TONES[p.tone].fill, color: TONES[p.tone].text }}
                >
                  {p.count}
                </div>
              ))}
          </div>
          <span className="w-[76px] shrink-0 text-[13px]" style={{ color: C.muted }}>
            {r.n} {r.n === 1 ? "chico" : "chicos"}
          </span>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1.5 text-sm">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded" style={{ background: TONES[l.tone].fill }} />
            <strong>{l.label}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
