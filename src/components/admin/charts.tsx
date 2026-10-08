// Gráficos del panel en HTML (se dibujan en el servidor), con la escala semáforo.
// Cada marca lleva su número o etiqueta y un title para ver el detalle al pasar el mouse.
import { LEVEL_TONE, TONES, dStyle, pctTone } from "@/lib/semaforo";
import { cohenD, fmt, type GroupSummary, levelOfMean, pct } from "@/lib/stats";
import type { TestDef } from "@/lib/tests";
import { C } from "./ui";

const toneOfLevel = (key: string) => TONES[LEVEL_TONE[key]];
const pctPos = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
/** Marcas del eje de puntaje: 0, un cuarto, la mitad, tres cuartos y el máximo de la prueba. */
const scoreTicks = (max: number) => [...new Set([0, Math.round(max / 4), Math.round(max / 2), Math.round((3 * max) / 4), max])];

// ───────── Niveles ─────────

export function LevelLegend({ test }: { test: TestDef }) {
  const LEVELS = test.levels;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {LEVELS.map((l) => (
        <span key={l.key} className="flex items-center gap-2 text-sm">
          <span className="h-3.5 w-3.5 rounded" style={{ background: toneOfLevel(l.key).fill }} />
          <strong>{l.name}</strong> {l.min}–{l.max}
        </span>
      ))}
    </div>
  );
}

/** Barra 100% con la cantidad de chicos en cada nivel. */
export function LevelStack({ test, levels, n, height = 48 }: { test: TestDef; levels: Record<string, number>; n: number; height?: number }) {
  const LEVELS = test.levels;
  return (
    <div className="flex gap-0.5 overflow-hidden rounded-[10px]" style={{ height }}>
      {LEVELS.filter((l) => levels[l.key] > 0).map((l) => {
        const t = toneOfLevel(l.key);
        return (
          <div
            key={l.key}
            title={`${l.name}: ${levels[l.key]} de ${n} (${pct(levels[l.key] / n)})`}
            className="flex items-center justify-center text-base font-bold"
            style={{ flexGrow: levels[l.key], flexBasis: 0, background: t.fill, color: t.text }}
          >
            {levels[l.key]}
          </div>
        );
      })}
    </div>
  );
}

export function LevelStackRows({ test, rows }: { test: TestDef; rows: { label: string; n: number; levels: Record<string, number> }[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-[170px] shrink-0 text-[15px] font-bold leading-tight">{r.label}</span>
          <div className="min-w-0 flex-1">
            <LevelStack test={test} levels={r.levels} n={r.n} height={40} />
          </div>
          <span className="w-[76px] shrink-0 text-[13px]" style={{ color: C.muted }}>
            {r.n} {r.n === 1 ? "chico" : "chicos"}
          </span>
        </div>
      ))}
      <div className="pt-1.5">
        <LevelLegend test={test} />
      </div>
    </div>
  );
}

/** Histograma del puntaje total, cada barra pintada según el nivel de ese puntaje. */
export function ScoreHistogram({ scores, test }: { scores: number[]; test: TestDef }) {
  const LEVELS = test.levels;
  const max = test.max;
  const counts = Array.from({ length: max + 1 }, (_, k) => scores.filter((s) => s === k).length);
  const top = Math.max(1, ...counts);
  const ticks = top <= 4 ? Array.from({ length: top + 1 }, (_, i) => top - i) : [top, Math.round((top * 2) / 3), Math.round(top / 3), 0];
  return (
    <div className="flex gap-2.5">
      <div className="flex h-[180px] w-5 flex-col justify-between text-right text-xs" style={{ color: C.muted }}>
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex h-[180px] items-end gap-[3px] border-b" style={{ borderColor: "#C9C3B6" }}>
          {counts.map((c, s) => (
            <div
              key={s}
              title={`Puntaje ${s}: ${c} ${c === 1 ? "chico" : "chicos"}`}
              className="min-w-0 flex-1 rounded-t"
              style={{ height: `${(c / top) * 100}%`, background: toneOfLevel(LEVELS.find((l) => s >= l.min && s <= l.max)!.key).fill }}
            />
          ))}
        </div>
        <div className="flex gap-[3px]">
          {LEVELS.map((l) => {
            const t = toneOfLevel(l.key);
            return (
              <div key={l.key} className="min-w-0 rounded-lg px-1 py-1.5 text-center text-[13px] font-bold" style={{ flexGrow: l.max - l.min + 1, flexBasis: 0, background: t.tint, color: t.ink }}>
                {l.name} · {l.min}–{l.max}
              </div>
            );
          })}
        </div>
        <span className="text-[13px]" style={{ color: C.muted }}>
          Puntaje total (0 a {max}). La altura de cada barra es la cantidad de chicos que sacó ese puntaje.
        </span>
      </div>
    </div>
  );
}

// ───────── Promedios con rango probable ─────────

function LevelBands({ test }: { test: TestDef }) {
  const LEVELS = test.levels;
  const max = test.max;
  return (
    <>
      {LEVELS.map((l, i) => {
        const from = l.min;
        const to = i < LEVELS.length - 1 ? LEVELS[i + 1].min : max;
        return <div key={l.key} className="absolute inset-y-0" style={{ left: pctPos(from, max), width: pctPos(to - from, max), background: toneOfLevel(l.key).tint, opacity: 0.6 }} />;
      })}
    </>
  );
}

export function MeanBars({ rows, test }: { rows: { label: string; sub: string; mean: number; ci: [number, number]; separate?: boolean }[]; test: TestDef }) {
  const LEVELS = test.levels;
  const max = test.max;
  return (
    <div className="flex flex-col">
      <div className="flex gap-3 pb-1">
        <span className="w-[170px] shrink-0" />
        <div className="relative h-4 min-w-0 flex-1">
          {LEVELS.map((l, i) => {
            const to = i < LEVELS.length - 1 ? LEVELS[i + 1].min : max;
            return (
              <span key={l.key} className="absolute truncate text-center text-xs font-bold" style={{ left: pctPos(l.min, max), width: pctPos(to - l.min, max), color: toneOfLevel(l.key).ink }}>
                {l.name}
              </span>
            );
          })}
        </div>
        <span className="w-[170px] shrink-0" />
      </div>
      {rows.map((r) => {
        const lv = levelOfMean(test, r.mean);
        const t = toneOfLevel(lv.key);
        return (
          <div key={r.label} className="flex items-center gap-3" style={{ height: 58, borderBottom: r.separate ? `2px solid ${C.line}` : undefined }}>
            <div className="flex w-[170px] shrink-0 flex-col">
              <span className="text-[15px] font-bold leading-tight">{r.label}</span>
              <span className="text-[13px]" style={{ color: C.muted }}>
                {r.sub}
              </span>
            </div>
            <div className="relative h-full min-w-0 flex-1" title={`${r.label}: promedio ${fmt(r.mean)}, rango probable ${fmt(r.ci[0])} a ${fmt(r.ci[1])}`}>
              <LevelBands test={test} />
              <div className="absolute left-0 rounded-r-md" style={{ top: 17, height: 24, width: pctPos(r.mean, max), background: t.fill }} />
              <div className="absolute h-0.5" style={{ top: 28, left: pctPos(r.ci[0], max), width: pctPos(r.ci[1] - r.ci[0], max), background: C.ink }} />
              <div className="absolute w-0.5" style={{ top: 22, height: 14, left: pctPos(r.ci[0], max), background: C.ink }} />
              <div className="absolute w-0.5" style={{ top: 22, height: 14, left: `calc(${pctPos(r.ci[1], max)} - 2px)`, background: C.ink }} />
            </div>
            <span className="w-[150px] shrink-0">
              <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-bold" style={{ background: t.tint, color: t.ink }}>
                {fmt(r.mean)} · {lv.name}
              </span>
            </span>
          </div>
        );
      })}
      <div className="flex gap-3 pt-1.5">
        <span className="w-[170px] shrink-0" />
        <div className="relative h-[18px] min-w-0 flex-1 text-xs" style={{ color: C.muted }}>
          {scoreTicks(max).map((v) => (
            <span key={v} className="absolute -translate-x-1/2" style={{ left: pctPos(v, max) }}>
              {v}
            </span>
          ))}
        </div>
        <span className="w-[170px] shrink-0" />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-[13px]" style={{ color: C.secondary }}>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[22px] rounded-sm" style={{ background: TONES.bien.fill }} />
          Barra: promedio, pintado según su nivel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-[22px]" style={{ background: C.ink }} />
          Línea: rango probable
        </span>
        <span>Fondo: niveles de desempeño</span>
      </div>
    </div>
  );
}

// ───────── Qué tan parejos (cajas) ─────────

export function SpreadBoxes({ rows, test }: { rows: { label: string; s: GroupSummary }[]; test: TestDef }) {
  const max = test.max;
  return (
    <div className="flex flex-col">
      {rows.map((r) => {
        const s = r.s;
        const t = toneOfLevel(levelOfMean(test, s.median).key);
        return (
          <div key={r.label} className="flex items-center gap-3" style={{ height: 58 }}>
            <div className="flex w-[170px] shrink-0 flex-col">
              <span className="text-[15px] font-bold leading-tight">{r.label}</span>
              <span className="text-[13px]" style={{ color: C.muted }}>
                {s.n} {s.n === 1 ? "chico" : "chicos"}
              </span>
            </div>
            <div
              className="relative h-full min-w-0 flex-1"
              title={`${r.label}: mínimo ${fmt(s.min, 0)}, la mitad central de ${fmt(s.q1, 0)} a ${fmt(s.q3, 0)}, mediana ${fmt(s.median, 1)}, máximo ${fmt(s.max, 0)}`}
            >
              <LevelBands test={test} />
              <div className="absolute h-0.5" style={{ top: 28, left: pctPos(s.min, max), width: pctPos(s.max - s.min, max), background: C.ink2 }} />
              <div className="absolute w-0.5" style={{ top: 20, height: 18, left: pctPos(s.min, max), background: C.ink2 }} />
              <div className="absolute w-0.5" style={{ top: 20, height: 18, left: `calc(${pctPos(s.max, max)} - 2px)`, background: C.ink2 }} />
              <div className="absolute rounded-md border-2" style={{ top: 15, height: 28, left: pctPos(s.q1, max), width: `max(4px, ${pctPos(s.q3 - s.q1, max)})`, background: t.fill, borderColor: C.ink }} />
              <div className="absolute w-[3px]" style={{ top: 12, height: 34, left: `calc(${pctPos(s.median, max)} - 1px)`, background: C.ink }} />
            </div>
            <span className="w-[150px] shrink-0 text-[13px]" style={{ color: C.secondary }}>
              de {fmt(s.q1, 0)} a {fmt(s.q3, 0)} · mediana {fmt(s.median, 1)}
            </span>
          </div>
        );
      })}
      <div className="flex gap-3 pt-1.5">
        <span className="w-[170px] shrink-0" />
        <div className="relative h-[18px] min-w-0 flex-1 text-xs" style={{ color: C.muted }}>
          {scoreTicks(max).map((v) => (
            <span key={v} className="absolute -translate-x-1/2" style={{ left: pctPos(v, max) }}>
              {v}
            </span>
          ))}
        </div>
        <span className="w-[170px] shrink-0" />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-[13px]" style={{ color: C.secondary }}>
        <span>Caja: la mitad central de los chicos</span>
        <span>Raya gruesa: la mediana</span>
        <span>Línea fina: del puntaje más bajo al más alto</span>
      </div>
    </div>
  );
}

// ───────── Diferencias entre grupos (d de Cohen) ─────────

export function CohenMatrix({ groups }: { groups: { name: string; scores: number[] }[] }) {
  const cols = `170px repeat(${groups.length}, minmax(0, 1fr))`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: cols }}>
        <span className="self-end text-[13px]" style={{ color: C.muted }}>
          Fila comparada con →
        </span>
        {groups.map((g) => (
          <span key={g.name} className="pb-1 text-center text-sm font-bold leading-tight">
            {g.name}
          </span>
        ))}
      </div>
      {groups.map((a) => (
        <div key={a.name} className="grid gap-1.5" style={{ gridTemplateColumns: cols }}>
          <span className="self-center text-[15px] font-bold leading-tight">{a.name}</span>
          {groups.map((b) => {
            if (a === b)
              return (
                <div key={b.name} className="flex h-[68px] flex-col items-center justify-center rounded-xl text-[13px]" style={{ background: "#F1EFEA", color: C.muted }}>
                  mismo colegio
                </div>
              );
            const d = cohenD(a.scores, b.scores);
            const st = dStyle(d);
            return (
              <div key={b.name} title={`${a.name} comparado con ${b.name}: ${st.label}`} className="flex h-[68px] flex-col items-center justify-center gap-0.5 rounded-xl" style={{ background: st.fill, color: st.text }}>
                <span className="text-xl font-bold">{Number.isFinite(d) ? `${d > 0 ? "+" : ""}${fmt(d, 2)}` : "–"}</span>
                <span className="text-[13px] font-semibold">{st.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ───────── Mapa de calor con el semáforo ─────────

export type HeatRow = { label: string; sub?: string; values: number[] };
export type HeatCell = { fill: string; text: string; label: string; value: string };

const pctCell = (v: number): HeatCell => {
  const t = TONES[pctTone(v)];
  return { fill: t.fill, text: t.text, label: t.label, value: pct(v) };
};

/**
 * Mapa de calor. Por defecto pinta porcentajes de acierto con el semáforo; `cell` permite otra escala
 * (apuro, segundos). `compact`: celdas y títulos más chicos, para muchas columnas (una por misión).
 */
export function ToneHeatmap({
  columns,
  groups,
  labelWidth = 230,
  cell = pctCell,
  compact,
}: {
  columns: string[];
  groups: { title?: string; rows: HeatRow[] }[];
  labelWidth?: number;
  cell?: (v: number) => HeatCell;
  compact?: boolean;
}) {
  const cols = `${labelWidth}px repeat(${columns.length}, minmax(0, 1fr))`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
        <span />
        {columns.map((c) => (
          <span key={c} className={`self-end pb-1.5 text-center font-bold leading-tight ${compact ? "text-[11px]" : "text-sm"}`} title={c}>
            {c}
          </span>
        ))}
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-1 pt-2">
          {g.title && (
            <span className="pb-0.5 text-xs font-bold tracking-[0.08em]" style={{ color: C.muted }}>
              {g.title}
            </span>
          )}
          {g.rows.map((r) => (
            <div key={r.label} className="grid items-center gap-1" style={{ gridTemplateColumns: cols }}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-semibold">{r.label}</span>
                {r.sub && (
                  <span className="truncate text-xs" style={{ color: C.muted }}>
                    {r.sub}
                  </span>
                )}
              </div>
              {r.values.map((v, i) => {
                const ok = Number.isFinite(v);
                const t = ok ? cell(v) : null;
                return (
                  <div
                    key={i}
                    title={`${r.label} · ${columns[i]}: ${t ? `${t.value} (${t.label})` : "sin datos"}`}
                    className={`flex items-center justify-center font-bold ${compact ? "h-9 rounded-md text-[13px]" : "h-10 rounded-lg text-[15px]"}`}
                    style={t ? { background: t.fill, color: t.text } : { background: "#F1EFEA", color: C.muted }}
                  >
                    {t ? t.value : "–"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
