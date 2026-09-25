// Gráficos SVG del panel (se renderizan en el servidor). Paleta y reglas: ver skill dataviz.
// Series categóricas en orden fijo; magnitudes con un solo tono (azul, claro → oscuro).
import { fmt, pct } from "@/lib/stats";

export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const INK = "#0b0b0b";
export const INK2 = "#52514e";
export const MUTED = "#898781";
export const GRID = "#e1e0d9";
export const AXIS = "#c3c2b7";
export const SURFACE = "#fcfcfb";
// Rampa secuencial azul (pasos 100 → 700)
export const BLUES = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];
export const ORDINAL4 = ["#86b6ef", "#3987e5", "#1c5cab", "#0d366b"]; // niveles (ordinal, desde el paso 250)

export function seqColor(v: number): string {
  if (!Number.isFinite(v)) return "#f0efec";
  const i = Math.max(0, Math.min(BLUES.length - 1, Math.round(v * (BLUES.length - 1))));
  return BLUES[i];
}
function inkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? INK : "#ffffff";
}

const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

export function Card({ title, subtitle, children, table }: { title: string; subtitle?: string; children: React.ReactNode; table?: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#fcfcfb] p-4 ring-1 ring-black/10">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-2 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-2 overflow-x-auto">{children}</div>
      {table && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-slate-500">Ver tabla</summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      )}
    </section>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-[#fcfcfb] p-4 ring-1 ring-black/10">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// Barra horizontal con extremo redondeado (4px) y base recta.
function HBarPath({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.min(4, w);
  if (w <= 0) return null;
  const d = `M${x},${y} H${x + w - r} a${r},${r} 0 0 1 ${r},${r} V${y + h - r} a${r},${r} 0 0 1 -${r},${r} H${x} Z`;
  return <path d={d} />;
}

export type BarRow = { label: string; value: number; ci?: [number, number]; note?: string };

/** Barras horizontales para comparar magnitudes (un solo tono). `max` define la escala (1 para proporciones). */
export function HBars({ rows, max, format = (v: number) => pct(v), width = 560, color = SERIES[0], ticks }: { rows: BarRow[]; max: number; format?: (v: number) => string; width?: number; color?: string; ticks?: number[] }) {
  const labelW = 170;
  const valueW = 56;
  const rowH = 28;
  const barH = 18;
  const top = 8;
  const height = top + rows.length * rowH + 18;
  const plotW = width - labelW - valueW - 8;
  const x = (v: number) => labelW + (Math.max(0, Math.min(max, v)) / max) * plotW;
  const tickVals = ticks ?? (max === 1 ? [0, 0.25, 0.5, 0.75, 1] : [0, max / 4, max / 2, (3 * max) / 4, max]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={FONT} role="img">
      {tickVals.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={top} y2={top + rows.length * rowH} stroke={GRID} strokeWidth="1" />
          <text x={x(t)} y={height - 4} fontSize="10" fill={MUTED} textAnchor="middle">
            {format(t)}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = top + i * rowH + (rowH - barH) / 2;
        const w = Number.isFinite(r.value) ? x(r.value) - labelW : 0;
        return (
          <g key={r.label} fill={color}>
            <title>{`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ""}`}</title>
            <text x={labelW - 8} y={y + barH / 2 + 4} fontSize="12" fill={INK2} textAnchor="end">
              {r.label.length > 26 ? r.label.slice(0, 25) + "…" : r.label}
            </text>
            <HBarPath x={labelW} y={y} w={w} h={barH} />
            {r.ci && Number.isFinite(r.ci[0]) && (
              <g stroke={INK} strokeWidth="1.5">
                <line x1={x(r.ci[0])} x2={x(r.ci[1])} y1={y + barH / 2} y2={y + barH / 2} />
                <line x1={x(r.ci[0])} x2={x(r.ci[0])} y1={y + 4} y2={y + barH - 4} />
                <line x1={x(r.ci[1])} x2={x(r.ci[1])} y1={y + 4} y2={y + barH - 4} />
              </g>
            )}
            <text x={Math.max(labelW + w, r.ci && Number.isFinite(r.ci[1]) ? x(r.ci[1]) : 0) + 6} y={y + barH / 2 + 4} fontSize="12" fill={INK} fontWeight="600">
              {format(r.value)}
            </text>
          </g>
        );
      })}
      <line x1={labelW} x2={labelW} y1={top} y2={top + rows.length * rowH} stroke={AXIS} strokeWidth="1" />
    </svg>
  );
}

/** Histograma de puntajes 0..max con bandas de nivel. */
export function Histogram({ scores, max, levels, width = 560 }: { scores: number[]; max: number; levels: { name: string; min: number; max: number }[]; width?: number }) {
  const counts = Array.from({ length: max + 1 }, (_, s) => scores.filter((x) => x === s).length);
  const top = 24;
  const bottom = 34;
  const left = 30;
  const height = 200;
  const plotH = height - top - bottom;
  const plotW = width - left - 10;
  const slot = plotW / (max + 1);
  const barW = Math.min(24, slot - 2);
  const maxCount = Math.max(1, ...counts);
  const y = (c: number) => top + plotH - (c / maxCount) * plotH;
  const gridVals = [0, Math.ceil(maxCount / 2), maxCount];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={FONT} role="img">
      {levels.map((l, i) => (
        <g key={l.name}>
          <rect x={left + l.min * slot} y={top} width={(l.max - l.min + 1) * slot} height={plotH} fill={i % 2 ? "#f4f4f1" : "transparent"} />
          <text x={left + (l.min + (l.max - l.min + 1) / 2) * slot} y={top - 8} fontSize="10" fill={MUTED} textAnchor="middle">
            {l.name}
          </text>
        </g>
      ))}
      {gridVals.map((g) => (
        <g key={g}>
          <line x1={left} x2={left + plotW} y1={y(g)} y2={y(g)} stroke={GRID} />
          <text x={left - 6} y={y(g) + 4} fontSize="10" fill={MUTED} textAnchor="end">
            {g}
          </text>
        </g>
      ))}
      {counts.map((c, s) => {
        const h = top + plotH - y(c);
        const x = left + s * slot + (slot - barW) / 2;
        const r = Math.min(4, h);
        return (
          <g key={s} fill={SERIES[0]}>
            <title>{`${s} puntos: ${c} estudiante${c === 1 ? "" : "s"}`}</title>
            {c > 0 && <path d={`M${x},${top + plotH} V${y(c) + r} a${r},${r} 0 0 1 ${r},-${r} H${x + barW - r} a${r},${r} 0 0 1 ${r},${r} V${top + plotH} Z`} />}
            {(s % 4 === 0 || s === max) && (
              <text x={x + barW / 2} y={height - 18} fontSize="10" fill={MUTED} textAnchor="middle">
                {s}
              </text>
            )}
          </g>
        );
      })}
      <line x1={left} x2={left + plotW} y1={top + plotH} y2={top + plotH} stroke={AXIS} />
      <text x={left + plotW / 2} y={height - 4} fontSize="10" fill={MUTED} textAnchor="middle">
        puntaje total (0 a {max})
      </text>
    </svg>
  );
}

/** Mapa de calor: filas × columnas, valores 0..1 (proporción de acierto). */
export function Heatmap({ rows, cols, values, colLabels, width, showValues = true }: { rows: string[]; cols: string[]; values: number[][]; colLabels?: string[]; width?: number; showValues?: boolean }) {
  const labelW = 150;
  const cell = cols.length > 14 ? 30 : 46;
  const cellH = 26;
  const headH = 40;
  const w = width ?? labelW + cols.length * cell + 10;
  const h = headH + rows.length * cellH + 8;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fontFamily={FONT} role="img">
      {cols.map((c, j) => (
        <text key={c} x={labelW + j * cell + cell / 2} y={headH - 8} fontSize="10" fill={INK2} textAnchor="middle">
          {(colLabels ?? cols)[j]}
        </text>
      ))}
      {rows.map((r, i) => (
        <g key={r}>
          <text x={labelW - 8} y={headH + i * cellH + cellH / 2 + 4} fontSize="12" fill={INK2} textAnchor="end">
            {r.length > 22 ? r.slice(0, 21) + "…" : r}
          </text>
          {cols.map((c, j) => {
            const v = values[i][j];
            const color = seqColor(v);
            return (
              <g key={c}>
                <title>{`${r} · ${(colLabels ?? cols)[j]}: ${pct(v)}`}</title>
                <rect x={labelW + j * cell + 1} y={headH + i * cellH + 1} width={cell - 2} height={cellH - 2} rx="3" fill={color} />
                {showValues && Number.isFinite(v) && (
                  <text x={labelW + j * cell + cell / 2} y={headH + i * cellH + cellH / 2 + 4} fontSize="10" fill={inkOn(color)} textAnchor="middle">
                    {Math.round(v * 100)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** Cajas y bigotes horizontales por grupo (un solo tono). */
export function BoxPlots({ groups, max, width = 560 }: { groups: { label: string; values: number[] }[]; max: number; width?: number }) {
  const labelW = 170;
  const rowH = 34;
  const top = 8;
  const height = top + groups.length * rowH + 22;
  const plotW = width - labelW - 20;
  const x = (v: number) => labelW + (v / max) * plotW;
  const q = (xs: number[], p: number) => {
    const s = [...xs].sort((a, b) => a - b);
    const pos = (s.length - 1) * p;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  };
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={FONT} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={top} y2={top + groups.length * rowH} stroke={GRID} />
          <text x={x(t)} y={height - 6} fontSize="10" fill={MUTED} textAnchor="middle">
            {fmt(t, 0)}
          </text>
        </g>
      ))}
      {groups.map((g, i) => {
        const cy = top + i * rowH + rowH / 2;
        if (g.values.length === 0) return null;
        const mn = Math.min(...g.values);
        const mx = Math.max(...g.values);
        const q1 = q(g.values, 0.25);
        const md = q(g.values, 0.5);
        const q3 = q(g.values, 0.75);
        return (
          <g key={g.label}>
            <title>{`${g.label}: n=${g.values.length} · mín ${mn} · Q1 ${fmt(q1)} · mediana ${fmt(md)} · Q3 ${fmt(q3)} · máx ${mx}`}</title>
            <text x={labelW - 8} y={cy + 4} fontSize="12" fill={INK2} textAnchor="end">
              {g.label.length > 18 ? g.label.slice(0, 17) + "…" : g.label} (n={g.values.length})
            </text>
            <line x1={x(mn)} x2={x(q1)} y1={cy} y2={cy} stroke={SERIES[0]} strokeWidth="2" />
            <line x1={x(q3)} x2={x(mx)} y1={cy} y2={cy} stroke={SERIES[0]} strokeWidth="2" />
            <rect x={x(q1)} y={cy - 9} width={Math.max(2, x(q3) - x(q1))} height={18} rx="3" fill={SERIES[0]} opacity="0.35" />
            <line x1={x(md)} x2={x(md)} y1={cy - 10} y2={cy + 10} stroke={SERIES[0]} strokeWidth="3" />
            {g.values.length < 5 && g.values.map((v, k) => <circle key={k} cx={x(v)} cy={cy} r="4" fill={SERIES[0]} stroke={SURFACE} strokeWidth="2" />)}
          </g>
        );
      })}
    </svg>
  );
}

/** Barras apiladas 100% por grupo con 4 niveles ordinales (rampa azul). */
export function LevelBars({ groups, levelNames, width = 560 }: { groups: { label: string; counts: number[] }[]; levelNames: string[]; width?: number }) {
  const labelW = 170;
  const rowH = 30;
  const barH = 20;
  const top = 8;
  const height = top + groups.length * rowH + 30;
  const plotW = width - labelW - 20;
  return (
    <div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={FONT} role="img">
        {groups.map((g, i) => {
          const total = g.counts.reduce((a, b) => a + b, 0) || 1;
          let acc = 0;
          const y = top + i * rowH + (rowH - barH) / 2;
          return (
            <g key={g.label}>
              <text x={labelW - 8} y={y + barH / 2 + 4} fontSize="12" fill={INK2} textAnchor="end">
                {g.label.length > 24 ? g.label.slice(0, 23) + "…" : g.label}
              </text>
              {g.counts.map((c, k) => {
                const w = (c / total) * plotW;
                const x = labelW + acc;
                acc += w;
                const p = c / total;
                return (
                  <g key={k}>
                    <title>{`${g.label} · ${levelNames[k]}: ${c} (${Math.round(p * 100)}%)`}</title>
                    {w > 0 && <rect x={x + 1} y={y} width={Math.max(0, w - 2)} height={barH} fill={ORDINAL4[k]} />}
                    {w > 34 && (
                      <text x={x + w / 2} y={y + barH / 2 + 4} fontSize="11" fill={inkOn(ORDINAL4[k])} textAnchor="middle">
                        {Math.round(p * 100)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
        {levelNames.map((n, k) => (
          <span key={n} className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: ORDINAL4[k] }} /> {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-slate-200 px-2 py-1 text-left font-semibold text-slate-600">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="odd:bg-slate-50">
            {r.map((c, j) => (
              <td key={j} className="px-2 py-1 tabular-nums text-slate-800">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
