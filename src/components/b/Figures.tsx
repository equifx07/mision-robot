import { Robot } from "@/components/MapView";

function Card({ x, y, w, h, title, minutes, children }: { x: number; y: number; w: number; h: number; title: string; minutes: number; children?: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="1.5" />
      <g transform={`translate(${w / 2} 40)`}>{children}</g>
      <text x={w / 2} y={h - 28} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">
        {title}
      </text>
      <text x={w / 2} y={h - 10} textAnchor="middle" fontSize="13" fill="#1d4ed8" fontWeight="700">
        {minutes} min
      </text>
    </g>
  );
}

function Pared() {
  return (
    <svg viewBox="0 0 440 150" width="440" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Tareas para pintar la pared">
      <Card x={10} y={10} w={130} h={120} title="Mover muebles" minutes={10}>
        <rect x="-30" y="-14" width="60" height="26" rx="6" fill="#a78bfa" stroke="#5b21b6" strokeWidth="2" />
        <rect x="-26" y="12" width="8" height="10" fill="#5b21b6" />
        <rect x="18" y="12" width="8" height="10" fill="#5b21b6" />
      </Card>
      <Card x={155} y={10} w={130} h={120} title="Tapar el piso" minutes={5}>
        <rect x="-34" y="-12" width="68" height="28" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <line x1="-24" y1="-12" x2="-34" y2="16" stroke="#b45309" strokeWidth="1.5" />
        <line x1="-4" y1="-12" x2="-14" y2="16" stroke="#b45309" strokeWidth="1.5" />
        <line x1="16" y1="-12" x2="6" y2="16" stroke="#b45309" strokeWidth="1.5" />
        <line x1="34" y1="-12" x2="24" y2="16" stroke="#b45309" strokeWidth="1.5" />
      </Card>
      <Card x={300} y={10} w={130} h={120} title="Pintar" minutes={30}>
        <rect x="-30" y="-16" width="44" height="18" rx="6" fill="#60a5fa" stroke="#1e40af" strokeWidth="2" />
        <line x1="14" y1="-7" x2="26" y2="-7" stroke="#1e40af" strokeWidth="3" />
        <line x1="26" y1="-7" x2="26" y2="20" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
      </Card>
    </svg>
  );
}

function Collar() {
  const beads = Array.from({ length: 10 }, (_, i) => i);
  return (
    <svg viewBox="0 0 440 90" width="440" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Collar con cuentas">
      <line x1="10" y1="45" x2="430" y2="45" stroke="#78716c" strokeWidth="3" />
      <circle cx="22" cy="45" r="7" fill="#44403c" />
      <text x="22" y="76" fontSize="11" textAnchor="middle" fill="#57534e">
        nudo
      </text>
      {beads.map((i) => {
        const x = 60 + i * 36;
        return i % 3 === 2 ? (
          <polygon key={i} points={`${x},31 ${x + 14},57 ${x - 14},57`} fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" strokeLinejoin="round" />
        ) : (
          <circle key={i} cx={x} cy="45" r="13" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
        );
      })}
      <text x="422" y="50" fontSize="18" fill="#57534e">
        …
      </text>
    </svg>
  );
}

const LETTER_COLORS: Record<string, string> = { A: "#f59e0b", B: "#3b82f6", C: "#10b981", R: "#ef4444", V: "#22c55e" };

function Tiles({ x, y, s }: { x: number; y: number; s: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {s.split("").map((ch, i) => (
        <g key={i} transform={`translate(${i * 30} 0)`}>
          <rect width="26" height="26" rx="5" fill={LETTER_COLORS[ch] ?? "#94a3b8"} />
          <text x="13" y="19" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">
            {ch}
          </text>
        </g>
      ))}
    </g>
  );
}

function Compresion() {
  return (
    <svg viewBox="0 0 470 110" width="470" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Ejemplo de mensaje acortado">
      <Tiles x={10} y={10} s="AAABBBBCC" />
      <text x="290" y="30" fontSize="20" fill="#475569">
        →
      </text>
      <text x="320" y="30" fontSize="20" fontWeight="800" fill="#0f172a">
        3A4B2C
      </text>
      <Tiles x={10} y={64} s="RRRRRVVVAA" />
      <text x="320" y="84" fontSize="20" fill="#475569">
        →
      </text>
      <text x="350" y="84" fontSize="22" fontWeight="800" fill="#0f172a">
        ?
      </text>
    </svg>
  );
}

function DotCard({ x, n }: { x: number; n: number }) {
  const cols = n >= 4 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const dots = Array.from({ length: n }, (_, i) => i);
  return (
    <g transform={`translate(${x} 10)`}>
      <rect width="70" height="96" rx="8" fill="#fff" stroke="#475569" strokeWidth="2" />
      {dots.map((i) => (
        <circle key={i} cx={cols === 1 ? 35 : 22 + (i % 2) * 26} cy={16 + Math.floor(i / cols) * (rows > 2 ? 18 : 24) + (rows === 1 ? 20 : rows === 2 ? 10 : 0)} r="6" fill="#1e293b" />
      ))}
      <text x="35" y="90" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1d4ed8">
        {n}
      </text>
    </g>
  );
}

function Tarjetas() {
  return (
    <svg viewBox="0 0 430 170" width="430" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Tarjetas de puntos">
      <DotCard x={10} n={8} />
      <DotCard x={95} n={4} />
      <DotCard x={180} n={2} />
      <DotCard x={265} n={1} />
      <text x="20" y="150" fontSize="15" fill="#0f172a">
        Ejemplo: <tspan fontWeight="800">5</tspan> = tarjeta 4 + tarjeta 1
      </text>
    </svg>
  );
}

function Node({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="24" fill={color} stroke="#1e293b" strokeWidth="2" />
      <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">
        {label}
      </text>
    </g>
  );
}

function Peso({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-12" y="-11" width="24" height="22" rx="6" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
        {n}
      </text>
    </g>
  );
}

function Mapa() {
  return (
    <svg viewBox="0 0 420 230" width="420" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Mapa del barrio">
      <g stroke="#64748b" strokeWidth="4" fill="none">
        <line x1="60" y1="100" x2="210" y2="40" />
        <line x1="210" y1="40" x2="360" y2="100" />
        <line x1="60" y1="100" x2="210" y2="160" />
        <line x1="210" y1="160" x2="360" y2="100" />
        <line x1="210" y1="40" x2="210" y2="160" />
        <path d="M 60 100 C 100 240, 320 240, 360 100" />
      </g>
      <Peso x={130} y={62} n={3} />
      <Peso x={290} y={62} n={2} />
      <Peso x={130} y={138} n={2} />
      <Peso x={290} y={138} n={4} />
      <Peso x={210} y={100} n={2} />
      <Peso x={210} y={203} n={7} />
      <text x="210" y="226" fontSize="11" fill="#475569" textAnchor="middle">
        avenida
      </text>
      <Node x={60} y={100} label="Escuela" color="#fde68a" />
      <Node x={210} y={40} label="Kiosco" color="#bfdbfe" />
      <Node x={210} y={160} label="Club" color="#bbf7d0" />
      <Node x={360} y={100} label="Plaza" color="#fecaca" />
    </svg>
  );
}

function Fila() {
  const nums = [3, 1, 4, 2];
  return (
    <svg viewBox="0 0 420 120" width="420" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Robots en fila">
      {nums.map((n, i) => (
        <g key={i} transform={`translate(${110 + i * 80} 60)`}>
          <Robot x={0} y={0} scale={1} />
          <circle cx="0" cy="-42" r="14" fill="#fff" stroke="#1e293b" strokeWidth="2" />
          <text y="-37" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a">
            {n}
          </text>
        </g>
      ))}
      <text x="40" y="62" fontSize="12" fill="#475569" textAnchor="middle">
        inspector
      </text>
      <text x="40" y="82" fontSize="22" fill="#475569" textAnchor="middle">
        →
      </text>
    </svg>
  );
}

function Luces() {
  const on = [true, false, true, true, false, true];
  return (
    <svg viewBox="0 0 440 110" width="440" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Fila de luces">
      <Robot x={40} y={60} scale={0.9} />
      {on.map((isOn, i) => (
        <g key={i} transform={`translate(${110 + i * 56} 50)`}>
          <circle r="18" fill={isOn ? "#fde047" : "#cbd5e1"} stroke={isOn ? "#ca8a04" : "#64748b"} strokeWidth="2" />
          {isOn && <circle r="26" fill="#fde047" opacity="0.25" />}
          <rect x="-8" y="16" width="16" height="10" rx="2" fill="#64748b" />
          <rect x="-6" y="30" width="12" height="8" rx="2" fill="#1e293b" />
        </g>
      ))}
    </svg>
  );
}

function Puerta() {
  return (
    <svg viewBox="0 0 420 150" width="420" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label="Puerta, llave, luz y gema">
      <rect x="20" y="15" width="90" height="120" rx="8" fill="#b45309" stroke="#78350f" strokeWidth="3" />
      <circle cx="92" cy="78" r="6" fill="#fde68a" stroke="#78350f" strokeWidth="2" />
      <g transform="translate(180 75)">
        <circle r="12" fill="none" stroke="#ca8a04" strokeWidth="5" />
        <line x1="10" y1="0" x2="48" y2="0" stroke="#ca8a04" strokeWidth="6" strokeLinecap="round" />
        <line x1="36" y1="0" x2="36" y2="12" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" />
        <line x1="46" y1="0" x2="46" y2="10" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" />
        <text y="42" x="18" textAnchor="middle" fontSize="12" fill="#475569">
          llave
        </text>
      </g>
      <g transform="translate(285 40)">
        <rect x="-16" y="-10" width="32" height="70" rx="8" fill="#1e293b" />
        <circle cy="8" r="10" fill="#ef4444" />
        <circle cy="40" r="10" fill="#22c55e" />
        <text y="78" textAnchor="middle" fontSize="12" fill="#475569">
          luz
        </text>
      </g>
      <g transform="translate(370 75)">
        <polygon points="0,-18 16,-5 0,18 -16,-5" fill="#22d3ee" stroke="#0e7490" strokeWidth="2" strokeLinejoin="round" />
        <text y="42" textAnchor="middle" fontSize="12" fill="#475569">
          gema
        </text>
      </g>
    </svg>
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
