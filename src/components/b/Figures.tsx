// Figuras de la Parte B (desafíos de lógica) y opciones dibujadas, con la paleta del mundo "Encastre".
import type { ReactNode } from "react";
import { Robot } from "@/components/MapView";

const INK = "#1F2B45";
const MUTED = "#5B6477";
const LINE = "#E3D6BA";
const BLUE = "#176CE0";
const ORANGE = "#FEA814";
const ORANGE_D = "#C67505";

function Svg({ w, h, label, children, maxW }: { w: number; h: number; label: string; children: ReactNode; maxW?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={maxW ?? w} style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function Minutes({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-30" y="-13" width="60" height="26" rx="13" fill="#E4EEFD" />
      <text y="5.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0D55BF">
        {n} min
      </text>
    </g>
  );
}

function TaskCard({ x, y, w, h, title, minutes, children }: { x: number; y: number; w: number; h: number; title: string; minutes: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="14" fill="#fff" stroke={LINE} strokeWidth="2.5" />
      <g transform={`translate(34 ${h / 2})`}>{children}</g>
      <text x="68" y={h / 2 - 6} fontSize="15" fontWeight="700" fill={INK}>
        {title}
      </text>
      <Minutes x={98} y={h / 2 + 15} n={minutes} />
    </g>
  );
}

// B1 · Tareas para pintar la pared: dos tareas en paralelo y "pintar" después.
function Pared() {
  return (
    <Svg w={640} h={200} label="Tareas: mover muebles 10 minutos, tapar el piso 5 minutos y, después, pintar 30 minutos" maxW={640}>
      <TaskCard x={10} y={10} w={200} h={78} title="Mover muebles" minutes={10}>
        <rect x="-20" y="-10" width="40" height="18" rx="5" fill="#B99AF5" stroke="#6D3FC9" strokeWidth="2" />
        <rect x="-17" y="8" width="6" height="8" fill="#6D3FC9" />
        <rect x="11" y="8" width="6" height="8" fill="#6D3FC9" />
      </TaskCard>
      <TaskCard x={10} y={110} w={200} h={78} title="Tapar el piso" minutes={5}>
        <rect x="-22" y="-10" width="44" height="20" rx="3" fill="#FFE08A" stroke="#B7791F" strokeWidth="2" />
        <path d="M-14 -10 L-20 10 M-2 -10 L-8 10 M10 -10 L4 10 M22 -10 L16 10" stroke="#B7791F" strokeWidth="1.6" />
      </TaskCard>
      {/* flechas: las dos tareas → pintar */}
      <path d="M214 49 C 290 49, 280 100, 330 100 M214 149 C 290 149, 280 100, 330 100" fill="none" stroke={MUTED} strokeWidth="3" strokeLinecap="round" />
      <path d="M326 92 L336 100 L326 108" fill="none" stroke={MUTED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="244" y="105" textAnchor="middle" fontSize="14" fontWeight="800" fill={MUTED}>
        después
      </text>
      <TaskCard x={342} y={61} w={200} h={78} title="Pintar la pared" minutes={30}>
        <rect x="-20" y="-14" width="30" height="14" rx="4" fill="#5E9CF0" stroke="#0D55BF" strokeWidth="2" />
        <path d="M10 -7 H16 V14" fill="none" stroke="#0D55BF" strokeWidth="3" strokeLinecap="round" />
      </TaskCard>
      <g transform="translate(578 80)">
        <Robot x={0} y={0} scale={0.95} />
      </g>
      <g transform="translate(616 80)">
        <Robot x={0} y={0} scale={0.95} />
      </g>
      <text x="597" y="130" textAnchor="middle" fontSize="13" fontWeight="800" fill={MUTED}>
        2 robots
      </text>
    </Svg>
  );
}

const BEAD_RED = "#E5484D";
const BEAD_BLUE = "#2F6FE0";

function Bead({ x, y, kind, r = 13 }: { x: number; y: number; kind: "o" | "t"; r?: number }) {
  return kind === "t" ? (
    <polygon points={`${x},${y - r * 1.05} ${x + r * 1.08},${y + r * 0.95} ${x - r * 1.08},${y + r * 0.95}`} fill={BEAD_BLUE} stroke="#173F8F" strokeWidth="2" strokeLinejoin="round" />
  ) : (
    <circle cx={x} cy={y} r={r} fill={BEAD_RED} stroke="#8E1F22" strokeWidth="2" />
  );
}

// B2 · Collar con patrón ● ● ▲
function Collar() {
  const beads = "ootootootoo".split("") as ("o" | "t")[];
  return (
    <Svg w={500} h={96} label="Collar: empieza en el nudo; círculo, círculo, triángulo, y así sigue" maxW={500}>
      <line x1="16" y1="46" x2="486" y2="46" stroke="#8A7E6B" strokeWidth="3" />
      <circle cx="24" cy="46" r="8" fill="#4A4036" />
      <text x="24" y="82" fontSize="13" fontWeight="700" textAnchor="middle" fill={MUTED}>
        nudo
      </text>
      {beads.map((k, i) => (
        <Bead key={i} x={62 + i * 38} y={46} kind={k} />
      ))}
      <text x="480" y="52" fontSize="20" fill={MUTED}>
        …
      </text>
    </Svg>
  );
}

const LETTER_COLORS: Record<string, string> = { A: "#E08A00", B: BLUE, C: "#0F8743", R: "#D6246E", V: "#0F8743" };

function Tiles({ x, y, s, groups }: { x: number; y: number; s: string; groups?: boolean }) {
  const runs: { ch: string; start: number; n: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.ch === s[i]) last.n++;
    else runs.push({ ch: s[i], start: i, n: 1 });
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      {s.split("").map((ch, i) => (
        <g key={i} transform={`translate(${i * 32} 0)`}>
          <rect width="28" height="30" rx="6" fill={LETTER_COLORS[ch] ?? "#94a3b8"} />
          <text x="14" y="21" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">
            {ch}
          </text>
        </g>
      ))}
      {groups &&
        runs.map((r) => (
          <g key={r.start}>
            <path d={`M${r.start * 32 + 2} 38 v6 H${(r.start + r.n) * 32 - 6} v-6`} fill="none" stroke={MUTED} strokeWidth="2" />
            <text x={(r.start * 32 + (r.start + r.n) * 32 - 4) / 2} y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>
              {r.n}
              {r.ch}
            </text>
          </g>
        ))}
    </g>
  );
}

// B3 · Mensajes acortados
function Compresion() {
  return (
    <Svg w={500} h={160} label="Ejemplo: AAABBBBCC se escribe 3A4B2C. ¿Cómo se escribe RRRRRVVVAA?" maxW={500}>
      <Tiles x={10} y={8} s="AAABBBBCC" groups />
      <text x="318" y="30" fontSize="22" fill={MUTED}>
        →
      </text>
      <text x="348" y="31" fontSize="24" fontWeight="800" fill={INK}>
        3A4B2C
      </text>
      <Tiles x={10} y={108} s="RRRRRVVVAA" />
      <text x="348" y="130" fontSize="22" fill={MUTED}>
        →
      </text>
      <rect x="376" y="106" width="58" height="34" rx="8" fill="#FFF3B8" stroke="#D39B00" strokeWidth="2.5" strokeDasharray="6 4" />
      <text x="405" y="131" textAnchor="middle" fontSize="22" fontWeight="800" fill="#8A6500">
        ?
      </text>
    </Svg>
  );
}

function DotCard({ x, y, n, w = 70, h = 96, highlight, dim }: { x: number; y: number; n: number; w?: number; h?: number; highlight?: boolean; dim?: boolean }) {
  const cols = n >= 4 ? 2 : 1;
  const dots = Array.from({ length: n }, (_, i) => i);
  const rows = Math.ceil(n / cols);
  // los puntos van en la parte de arriba; el número, abajo
  const area = h - 30;
  const dr = h >= 90 ? 5.5 : 4.2;
  const gy = rows > 1 ? Math.min(20, (area - 2 * dr - 6) / (rows - 1)) : 0;
  const top = 6 + dr + (area - 2 * dr - 6 - (rows - 1) * gy) / 2;
  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.45 : 1}>
      <rect width={w} height={h} rx="10" fill="#fff" stroke={highlight ? BLUE : "#9AA6BA"} strokeWidth={highlight ? 3.5 : 2} />
      {dots.map((i) => (
        <circle key={i} cx={cols === 1 ? w / 2 : w / 2 - dr * 2 + (i % 2) * dr * 4} cy={top + Math.floor(i / cols) * gy} r={dr} fill={INK} />
      ))}
      <text x={w / 2} y={h - 9} textAnchor="middle" fontSize={h >= 90 ? 17 : 15} fontWeight="800" fill={BLUE}>
        {n}
      </text>
    </g>
  );
}

// B4 · Tarjetas de puntos
function Tarjetas() {
  return (
    <Svg w={520} h={130} label="Tarjetas de 8, 4, 2 y 1 puntos. Ejemplo: el 5 se forma con las tarjetas 4 y 1" maxW={520}>
      <DotCard x={10} y={14} n={8} />
      <DotCard x={92} y={14} n={4} />
      <DotCard x={174} y={14} n={2} />
      <DotCard x={256} y={14} n={1} />
      <line x1="346" y1="8" x2="346" y2="122" stroke={LINE} strokeWidth="2" />
      <text x="360" y="30" fontSize="14" fontWeight="700" fill={MUTED}>
        Ejemplo
      </text>
      <DotCard x={360} y={40} n={4} w={50} h={70} highlight />
      <text x="420" y="82" fontSize="20" fontWeight="800" fill={INK}>
        +
      </text>
      <DotCard x={436} y={40} n={1} w={50} h={70} highlight />
      <text x="496" y="82" fontSize="20" fontWeight="800" fill={INK}>
        = 5
      </text>
    </Svg>
  );
}

function Node({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-40" y="-20" width="80" height="40" rx="20" fill={color} stroke={INK} strokeWidth="2" />
      <text y="5" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>
        {label}
      </text>
    </g>
  );
}

function Peso({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="15" fill="#fff" stroke={INK} strokeWidth="2" />
      <text y="6" textAnchor="middle" fontSize="16" fontWeight="800" fill={INK}>
        {n}
      </text>
    </g>
  );
}

// B5 · Mapa del barrio con cuadras
function Mapa() {
  return (
    <Svg w={520} h={270} label="Mapa: Escuela, Kiosco, Club y Plaza unidos por caminos con su cantidad de cuadras" maxW={520}>
      <g stroke="#8C97AB" strokeWidth="6" strokeLinecap="round" fill="none">
        <line x1="70" y1="120" x2="260" y2="44" />
        <line x1="260" y1="44" x2="450" y2="120" />
        <line x1="70" y1="120" x2="260" y2="196" />
        <line x1="260" y1="196" x2="450" y2="120" />
        <line x1="260" y1="44" x2="260" y2="196" />
        <path d="M 70 120 C 110 290, 410 290, 450 120" />
      </g>
      <Peso x={160} y={75} n={3} />
      <Peso x={360} y={75} n={2} />
      <Peso x={160} y={165} n={2} />
      <Peso x={360} y={165} n={4} />
      <Peso x={260} y={120} n={2} />
      <Peso x={260} y={247} n={7} />
      <text x="330" y="252" fontSize="13" fontWeight="700" fill={MUTED}>
        avenida
      </text>
      <Node x={70} y={120} label="Escuela" color="#FFE08A" />
      <Node x={260} y={44} label="Kiosco" color="#BFD6FA" />
      <Node x={260} y={196} label="Club" color="#B9E7C9" />
      <Node x={450} y={120} label="Plaza" color="#FBC5D6" />
    </Svg>
  );
}

function NumBadge({ x, y, n, r = 17, fill = "#fff" }: { x: number; y: number; n: number; r?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} stroke={INK} strokeWidth="2.2" />
      <text y={r * 0.36} textAnchor="middle" fontSize={r * 1.05} fontWeight="800" fill={INK}>
        {n}
      </text>
    </g>
  );
}

function Pair({ x, y, a, b, after }: { x: number; y: number; a: number; b: number; after: [number, number] }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <NumBadge x={0} y={0} n={a} r={13} />
      <NumBadge x={30} y={0} n={b} r={13} />
      <path d="M52 0 H74 M68 -6 L75 0 L68 6" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <NumBadge x={96} y={0} n={after[0]} r={13} fill={after[0] !== a ? "#FFF3B8" : "#fff"} />
      <NumBadge x={126} y={0} n={after[1]} r={13} fill={after[1] !== b ? "#FFF3B8" : "#fff"} />
    </g>
  );
}

// B6 · Fila de robots y la regla del inspector (una pasada de burbuja)
function Fila() {
  const nums = [3, 1, 4, 2];
  return (
    <Svg w={560} h={214} label="Robots en fila con los números 3, 1, 4 y 2. La lupa del inspector mira dos vecinos" maxW={560}>
      {nums.map((n, i) => (
        <g key={i} transform={`translate(${151 + i * 86} 84)`}>
          <Robot x={0} y={0} scale={1.05} />
          <NumBadge x={0} y={-48} n={n} />
        </g>
      ))}
      <rect x="105" y="18" width="178" height="104" rx="16" fill="none" stroke="#E08A00" strokeWidth="3.5" strokeDasharray="9 6" />
      <text x="194" y="140" textAnchor="middle" fontSize="13" fontWeight="700" fill="#B06A00">
        el inspector empieza acá
      </text>
      <line x1="10" y1="156" x2="550" y2="156" stroke={LINE} strokeWidth="2" />
      <text x="12" y="190" fontSize="14" fontWeight="700" fill={MUTED}>
        Regla:
      </text>
      <Pair x={78} y={185} a={5} b={2} after={[2, 5]} />
      <text x="220" y="190" fontSize="13" fontWeight="700" fill={MUTED}>
        cambian
      </text>
      <Pair x={316} y={185} a={1} b={3} after={[1, 3]} />
      <text x="458" y="190" fontSize="13" fontWeight="700" fill={MUTED}>
        quedan igual
      </text>
    </Svg>
  );
}

// B7 · Fila de luces
function Luces() {
  const on = [true, false, true, true, false, true];
  return (
    <Svg w={500} h={150} label="Fila de 6 luces: prendida, apagada, prendida, prendida, apagada, prendida" maxW={500}>
      <Robot x={36} y={62} scale={1} />
      {on.map((isOn, i) => (
        <g key={i} transform={`translate(${112 + i * 64} 48)`}>
          {isOn && <circle r="30" fill="#FDE047" opacity="0.28" />}
          <circle r="20" fill={isOn ? "#FDE047" : "#CBD5E1"} stroke={isOn ? "#CA8A04" : "#64748B"} strokeWidth="2.5" />
          <rect x="-9" y="18" width="18" height="10" rx="2" fill="#64748B" />
          <rect x="-14" y="46" width="28" height="18" rx="6" fill="#E5484D" stroke="#8E1F22" strokeWidth="2" />
          <text y="88" textAnchor="middle" fontSize="12" fontWeight="700" fill={MUTED}>
            {isOn ? "prendida" : "apagada"}
          </text>
        </g>
      ))}
    </Svg>
  );
}

function Key({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="11" fill="none" stroke="#C98A00" strokeWidth="5" />
      <line x1="10" y1="0" x2="42" y2="0" stroke="#C98A00" strokeWidth="6" strokeLinecap="round" />
      <line x1="32" y1="0" x2="32" y2="11" stroke="#C98A00" strokeWidth="5" strokeLinecap="round" />
      <line x1="41" y1="0" x2="41" y2="9" stroke="#C98A00" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function TrafficLight({ x, y, green, s = 1 }: { x: number; y: number; green: boolean | null; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-15" y="-32" width="30" height="64" rx="9" fill="#26324A" />
      <circle cy="-15" r="10" fill={green === false || green === null ? "#EF4444" : "#5B2C2C"} />
      <circle cy="15" r="10" fill={green === true || green === null ? "#22C55E" : "#1F4A31"} />
    </g>
  );
}

function Gem({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <polygon points="0,-17 15,-4 0,17 -15,-4" fill="#E4458F" stroke="#9C1F5C" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="-15" y1="-4" x2="15" y2="-4" stroke="#9C1F5C" strokeWidth="1.5" />
    </g>
  );
}

/** Tachado rojo: "no tiene". */
function Nope({ x, y, r = 24 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="none" stroke="#E0322B" strokeWidth="4" />
      <line x1={-r * 0.7} y1={r * 0.7} x2={r * 0.7} y2={-r * 0.7} stroke="#E0322B" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

// B8 · Puerta, llave, luz y gema
function Puerta() {
  return (
    <Svg w={500} h={150} label="Puerta, llave, luz verde o roja y gema" maxW={500}>
      <rect x="16" y="14" width="80" height="122" rx="8" fill="#B45309" stroke="#78350F" strokeWidth="3" />
      <circle cx="80" cy="78" r="6" fill="#FDE68A" stroke="#78350F" strokeWidth="2" />
      <Key x={170} y={66} />
      <text x="186" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill={MUTED}>
        llave
      </text>
      <TrafficLight x={306} y={66} green={null} />
      <text x="306" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill={MUTED}>
        luz
      </text>
      <Gem x={420} y={66} s={1.3} />
      <text x="420" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill={MUTED}>
        gema
      </text>
    </Svg>
  );
}

export function Figure({ id }: { id: string }) {
  switch (id) {
    case "pared":
      return <Pared />;
    case "collar":
      return <Collar />;
    case "compresion":
      return <Compresion />;
    case "tarjetas":
      return <Tarjetas />;
    case "mapa":
      return <Mapa />;
    case "fila":
      return <Fila />;
    case "luces":
      return <Luces />;
    case "puerta":
      return <Puerta />;
    default:
      return null;
  }
}

// ───────── Opciones dibujadas ─────────

const COLLAR_OPTS: ("o" | "t")[][] = [
  ["o", "o", "t"],
  ["o", "t", "o"],
  ["o", "t"],
  ["o", "o", "t", "t"],
];

/** Bloque "repetir" con cuentas adentro (mismo lenguaje que la Parte A). */
function CollarOption({ beads }: { beads: ("o" | "t")[] }) {
  const w = 104 + beads.length * 34;
  return (
    <svg viewBox={`0 0 ${w} 52`} width={w} height={52} role="img" aria-label={`repetir ${beads.map((b) => (b === "o" ? "círculo" : "triángulo")).join(", ")}`}>
      <rect x="1" y="1" width={w - 2} height="46" rx="10" fill={ORANGE} />
      <rect x="1" y="41" width={w - 2} height="8" rx="4" fill={ORANGE_D} />
      <rect x="1" y="1" width={w - 2} height="44" rx="10" fill={ORANGE} />
      <path d="M26 24a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L26 20M26 11v5h-5" transform="translate(4 0)" fill="none" stroke="#2D1700" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="40" y="29" fontSize="15" fontWeight="700" fill="#2D1700">
        repetir
      </text>
      <rect x="98" y="7" width={beads.length * 34 + 2} height="34" rx="8" fill="#fff" />
      {beads.map((b, i) => (
        <Bead key={i} x={116 + i * 34} y={24} kind={b} r={10} />
      ))}
    </svg>
  );
}

const CARD_OPTS = [
  [8, 2, 1],
  [8, 4],
  [4, 2, 1],
  [8, 4, 1],
];

function CardsOption({ cards }: { cards: number[] }) {
  const w = cards.length * 56;
  return (
    <svg viewBox={`0 0 ${w} 76`} width={w} height={76} role="img" aria-label={`tarjetas ${cards.join(", ")}`}>
      {cards.map((n, i) => (
        <DotCard key={i} x={3 + i * 56} y={3} n={n} w={48} h={70} />
      ))}
    </svg>
  );
}

const ROW_OPTS = [
  [1, 3, 2, 4],
  [1, 2, 3, 4],
  [3, 1, 2, 4],
  [1, 3, 4, 2],
];

function RowOption({ nums }: { nums: number[] }) {
  return (
    <svg viewBox="0 0 176 44" width={176} height={44} role="img" aria-label={nums.join(", ")}>
      {nums.map((n, i) => (
        <NumBadge key={i} x={22 + i * 44} y={22} n={n} r={18} />
      ))}
    </svg>
  );
}

const DOOR_OPTS: { hasKey: boolean; green: boolean; gem: boolean }[] = [
  { hasKey: true, green: false, gem: false },
  { hasKey: false, green: true, gem: true },
  { hasKey: false, green: false, gem: false },
  { hasKey: true, green: true, gem: true },
];

function DoorOption({ hasKey, green, gem }: { hasKey: boolean; green: boolean; gem: boolean }) {
  return (
    <svg viewBox="0 0 220 76" width={220} height={76} role="img" aria-label={`${hasKey ? "tiene la llave" : "no tiene la llave"}, luz ${green ? "verde" : "roja"}, ${gem ? "lleva una gema" : "no lleva gema"}`}>
      <Key x={22} y={36} s={0.9} />
      {!hasKey && <Nope x={38} y={36} />}
      <TrafficLight x={110} y={38} green={green} s={0.95} />
      <Gem x={184} y={36} s={1.1} />
      {!gem && <Nope x={184} y={36} />}
    </svg>
  );
}

/** Opción dibujada de un ítem de la Parte B (`index` es el índice original de la opción). */
export function OptionFigure({ id, index }: { id: string; index: number }) {
  switch (id) {
    case "collar":
      return <CollarOption beads={COLLAR_OPTS[index]} />;
    case "tarjetas":
      return <CardsOption cards={CARD_OPTS[index]} />;
    case "fila":
      return <RowOption nums={ROW_OPTS[index]} />;
    case "puerta":
      return <DoorOption {...DOOR_OPTS[index]} />;
    default:
      return null;
  }
}
