import type { Cell, GameMap } from "@/lib/model";
import { edgesOf, targetTrail, type Seg } from "@/lib/sim";

type Props = {
  map: GameMap;
  /** Posición del robot (por defecto, el inicio). */
  robotAt?: Cell;
  /** Recorrido a dibujar (modo revisión / animación). */
  visited?: Cell[];
  /** Rastro pintado a mostrar en lienzo (por defecto, la figura objetivo). */
  trail?: Set<Seg>;
  /** Muestra las coordenadas de cada casilla (solo revisión). */
  showCoords?: boolean;
  className?: string;
};

const CS = 52; // tamaño de casilla
const GAP = 16; // separación entre casillas (donde van los caminos)
const CW = 22; // ancho del camino
const PAD = 10;
const DOT = 40; // paso entre puntos del lienzo

export function Robot({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <line x1="0" y1="-23" x2="0" y2="-17" stroke="#1e3a8a" strokeWidth="2" />
      <circle cx="0" cy="-25" r="3" fill="#f59e0b" />
      <rect x="-11" y="-17" width="22" height="14" rx="4" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />
      <circle cx="-5" cy="-10" r="2.8" fill="#fff" />
      <circle cx="5" cy="-10" r="2.8" fill="#fff" />
      <circle cx="-5" cy="-10" r="1.3" fill="#1e3a8a" />
      <circle cx="5" cy="-10" r="1.3" fill="#1e3a8a" />
      <rect x="-14" y="-1" width="28" height="18" rx="5" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
      <rect x="-6" y="4" width="12" height="7" rx="2" fill="#bfdbfe" />
      <circle cx="-9" cy="20" r="4" fill="#1f2937" />
      <circle cx="9" cy="20" r="4" fill="#1f2937" />
    </g>
  );
}

function Rock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon
        points="-18,8 -14,-6 -4,-14 8,-13 17,-4 18,8 10,15 -8,15"
        fill="#9ca3af"
        stroke="#4b5563"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polyline points="-8,-2 0,-8 8,-3" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Gem({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,-15 13,-4 0,15 -13,-4" fill="#22d3ee" stroke="#0e7490" strokeWidth="2" strokeLinejoin="round" />
      <polyline points="-13,-4 13,-4" stroke="#0e7490" strokeWidth="1.5" />
      <polyline points="-6,-4 0,15 6,-4" fill="none" stroke="#0e7490" strokeWidth="1.2" />
    </g>
  );
}

function Flag({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="-8" y1="-16" x2="-8" y2="14" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="-8,-16 12,-9 -8,-2" fill="#22c55e" stroke="#166534" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
}

export function MapView({ map, robotAt, visited, trail, showCoords, className }: Props) {
  if (map.kind === "maze") {
    const W = PAD * 2 + map.cols * CS + (map.cols - 1) * GAP;
    const H = PAD * 2 + map.rows * CS + (map.rows - 1) * GAP;
    const cx = (col: number) => PAD + (col - 1) * (CS + GAP) + CS / 2;
    const cy = (row: number) => PAD + (row - 1) * (CS + GAP) + CS / 2;
    const isBase = (col: number, row: number) => map.base[0] === col && map.base[1] === row;
    const robot = robotAt ?? map.start;
    const edges = edgesOf(map);
    const cells: Cell[] = [];
    for (let row = 1; row <= map.rows; row++) for (let col = 1; col <= map.cols; col++) cells.push([col, row]);

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ maxWidth: "100%", height: "auto" }}
        className={className}
        role="img"
        aria-label="Mapa del laberinto"
      >
        {/* caminos */}
        {edges.map(([a, b], i) => {
          const horizontal = a[1] === b[1];
          const x = horizontal ? Math.min(cx(a[0]), cx(b[0])) + CS / 2 : cx(a[0]) - CW / 2;
          const y = horizontal ? cy(a[1]) - CW / 2 : Math.min(cy(a[1]), cy(b[1])) + CS / 2;
          return (
            <rect
              key={i}
              x={x - (horizontal ? 2 : 0)}
              y={y - (horizontal ? 0 : 2)}
              width={horizontal ? GAP + 4 : CW}
              height={horizontal ? CW : GAP + 4}
              fill="#cbd5e1"
            />
          );
        })}
        {/* casillas */}
        {cells.map(([col, row]) => (
          <g key={`${col}-${row}`}>
            <rect
              x={cx(col) - CS / 2}
              y={cy(row) - CS / 2}
              width={CS}
              height={CS}
              rx="9"
              fill={isBase(col, row) ? "#dcfce7" : "#f1f5f9"}
              stroke={isBase(col, row) ? "#16a34a" : "#94a3b8"}
              strokeWidth={isBase(col, row) ? 2.5 : 1.5}
            />
            {showCoords && (
              <text x={cx(col) - CS / 2 + 4} y={cy(row) - CS / 2 + 11} fontSize="9" fill="#94a3b8">
                {col},{row}
              </text>
            )}
          </g>
        ))}
        {/* base */}
        <Flag x={cx(map.base[0])} y={cy(map.base[1]) - 4} />
        <text x={cx(map.base[0])} y={cy(map.base[1]) + 22} fontSize="9" fontWeight="700" fill="#166534" textAnchor="middle">
          BASE
        </text>
        {/* gemas y rocas */}
        {(map.gems ?? []).map(([col, row]) => (
          <Gem key={`g${col}-${row}`} x={cx(col)} y={cy(row)} />
        ))}
        {(map.rocks ?? []).map(([col, row]) => (
          <Rock key={`r${col}-${row}`} x={cx(col)} y={cy(row)} />
        ))}
        {/* recorrido (revisión) */}
        {visited && visited.length > 1 && (
          <polyline
            points={visited.map(([col, row]) => `${cx(col)},${cy(row)}`).join(" ")}
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
            strokeDasharray="6 5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.9"
          />
        )}
        <Robot x={cx(robot[0])} y={cy(robot[1])} scale={0.82} />
      </svg>
    );
  }

  // Lienzo: puntos y rastro pintado
  const W = PAD * 2 + (map.cols - 1) * DOT + 20;
  const H = PAD * 2 + (map.rows - 1) * DOT + 20;
  const px = (col: number) => PAD + 10 + (col - 1) * DOT;
  const py = (row: number) => PAD + 10 + (row - 1) * DOT;
  const segs = trail ?? targetTrail(map);
  const robot = robotAt ?? map.start;
  const dots: Cell[] = [];
  for (let row = 1; row <= map.rows; row++) for (let col = 1; col <= map.cols; col++) dots.push([col, row]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label="Figura a dibujar"
    >
      <rect x="0" y="0" width={W} height={H} rx="10" fill="#fffbeb" stroke="#fcd34d" />
      {dots.map(([col, row]) => (
        <circle key={`${col}-${row}`} cx={px(col)} cy={py(row)} r="3.2" fill="#cbd5e1" />
      ))}
      {[...segs].map((s) => {
        const [a, b] = s.split("-").map((p) => p.split(",").map(Number));
        return (
          <line
            key={s}
            x1={px(a[0])}
            y1={py(a[1])}
            x2={px(b[0])}
            y2={py(b[1])}
            stroke="#f97316"
            strokeWidth="7"
            strokeLinecap="round"
          />
        );
      })}
      {showCoords &&
        dots.map(([col, row]) => (
          <text key={`t${col}-${row}`} x={px(col) + 4} y={py(row) - 4} fontSize="8" fill="#94a3b8">
            {col},{row}
          </text>
        ))}
      <Robot x={px(robot[0])} y={py(robot[1]) + 2} scale={0.55} />
    </svg>
  );
}
