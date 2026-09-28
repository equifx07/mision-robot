// Ilustraciones del mundo "Encastre" (opción A): robot, islas, puentes, base, rocas, gemas y lienzo.
// Todo se arma como SVG en texto (determinista, igual en servidor y cliente).
// Mismo diseño que el canvas: docs/diseno/generador/gen.js

import type { CanvasMap, Cell, Dir, MazeMap } from "./model";
import { edgeKey, mapEdges, targetTrail, type Seg } from "./sim";

export type RobotState = "normal" | "happy" | "crash" | "paint";

const n = (x: number) => Math.round(x * 100) / 100;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sparkle(cx: number, cy: number, r: number, fill: string) {
  const k = r * 0.18;
  return `<path d="M${n(cx)} ${n(cy - r)} Q${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)} Q${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)} Q${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)} Q${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)} Z" fill="${fill}"/>`;
}

// ───────── robot (caja de 120 × 140) ─────────

export function robotSvg(state: RobotState = "normal"): string {
  const O = "#1F2B45", W = "#F4F7FC", B = "#2E6FD8", Y = "#F59E0B", S = "#1F2B45", E = "#7BE6FF", G = "#A9B4C8", T = "#3A4660";
  const out: string[] = [];
  if (state === "paint") out.push(`<path d="M6 133 C 34 123, 70 139, 114 127" fill="none" stroke="#F26B1D" stroke-width="7" stroke-linecap="round"/>`);
  if (state === "happy") out.push(sparkle(13, 40, 8, Y), sparkle(107, 30, 9, Y), sparkle(97, 7, 5.5, Y));
  if (state === "crash") out.push(sparkle(17, 15, 7, Y), sparkle(101, 12, 5.5, Y), `<path d="M104 56 L114 50 M107 69 L118 69 M104 82 L114 88" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`);
  const g: string[] = [];
  if (state === "crash") g.push(`<path d="M60 26 V18 L68 12" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="10" r="6" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`);
  else g.push(`<line x1="60" y1="12" x2="60" y2="26" stroke="${O}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="10" r="6" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`);
  const armDown = (x: number) => `<rect x="${x}" y="84" width="13" height="24" rx="6.5" fill="${W}" stroke="${O}" stroke-width="2.5"/>`;
  const armLine = (x1: number, y1: number, x2: number, y2: number) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${O}" stroke-width="15" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${W}" stroke-width="9" stroke-linecap="round"/>`;
  if (state === "happy") g.push(armLine(36, 90, 17, 64), armLine(84, 90, 103, 64));
  else if (state === "crash") g.push(armLine(36, 90, 15, 72), armLine(84, 92, 104, 108));
  else if (state === "paint")
    g.push(
      armDown(20),
      armLine(84, 92, 104, 104),
      `<g transform="rotate(-25 108 104)"><rect x="103.5" y="100" width="9" height="18" rx="2.5" fill="#FFFFFF" stroke="${O}" stroke-width="2"/><path d="M104 117.5 L108 126 L112 117.5 Z" fill="#F26B1D" stroke="${O}" stroke-width="2" stroke-linejoin="round"/></g>`,
    );
  else g.push(armDown(20), armDown(87));
  g.push(`<rect x="52" y="72" width="16" height="10" rx="2" fill="${G}" stroke="${O}" stroke-width="2.5"/>`);
  g.push(
    `<rect x="32" y="80" width="56" height="36" rx="13" fill="${B}" stroke="${O}" stroke-width="3"/>`,
    `<path d="M40 88.5 H47" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>`,
    `<circle cx="60" cy="97" r="7.5" fill="#FFD166" stroke="${O}" stroke-width="2.5"/>`,
  );
  g.push(
    `<rect x="28" y="114" width="64" height="20" rx="10" fill="${T}" stroke="${O}" stroke-width="3"/>`,
    `<circle cx="41" cy="124" r="4.8" fill="${G}"/><circle cx="60" cy="124" r="4.8" fill="${G}"/><circle cx="79" cy="124" r="4.8" fill="${G}"/>`,
  );
  g.push(
    `<rect x="17" y="41" width="12" height="20" rx="5" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`,
    `<rect x="91" y="41" width="12" height="20" rx="5" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`,
    `<rect x="26" y="25" width="68" height="50" rx="18" fill="${W}" stroke="${O}" stroke-width="3"/>`,
    `<rect x="34" y="33" width="52" height="34" rx="12" fill="${S}"/>`,
  );
  if (state === "happy")
    g.push(`<path d="M43.5 51 Q49 42.5 54.5 51" fill="none" stroke="${E}" stroke-width="3.6" stroke-linecap="round"/><path d="M65.5 51 Q71 42.5 76.5 51" fill="none" stroke="${E}" stroke-width="3.6" stroke-linecap="round"/><path d="M52.5 56.5 Q60 66.5 67.5 56.5 Z" fill="${E}"/>`);
  else if (state === "crash")
    g.push(`<path d="M45 44 L53 52 M53 44 L45 52" stroke="#FF7B7B" stroke-width="3.2" stroke-linecap="round"/><path d="M67 44 L75 52 M75 44 L67 52" stroke="#FF7B7B" stroke-width="3.2" stroke-linecap="round"/><path d="M50 60.5 q2.5 -3 5 0 t5 0 t5 0 t5 0" fill="none" stroke="${E}" stroke-width="2.4" stroke-linecap="round"/>`);
  else {
    const dx = state === "paint" ? 2.5 : 0, dy = state === "paint" ? 2 : 0;
    g.push(`<ellipse cx="${49 + dx}" cy="${48 + dy}" rx="5.5" ry="7" fill="${E}"/><ellipse cx="${71 + dx}" cy="${48 + dy}" rx="5.5" ry="7" fill="${E}"/><circle cx="${51 + dx}" cy="${45.5 + dy}" r="1.8" fill="#FFFFFF"/><circle cx="${73 + dx}" cy="${45.5 + dy}" r="1.8" fill="#FFFFFF"/><path d="M54 59.5 Q60 64 66 59.5" fill="none" stroke="${E}" stroke-width="2.5" stroke-linecap="round"/>`);
  }
  const body = g.join("");
  return out.join("") + (state === "crash" ? `<g transform="rotate(-9 60 128)">${body}</g>` : body);
}

/** Robot centrado en (x, y) con altura `h` px. */
export function placeRobot(x: number, y: number, h: number, state: RobotState): string {
  const k = h / 140;
  return `<g transform="translate(${n(x - 60 * k)} ${n(y - 72 * k)}) scale(${n(k)})">${robotSvg(state)}</g>`;
}

// ───────── piezas del mapa ─────────

function board(W: number, H: number, seed: number) {
  const r = rng(seed);
  let s = `<rect width="${W}" height="${H}" rx="20" fill="#8FD0EE"/>`;
  const count = Math.round((W * H) / 2600);
  for (let i = 0; i < count; i++) {
    const x = n(8 + r() * (W - 28)), y = n(8 + r() * (H - 16));
    s += `<path d="M${x} ${y} q4 -4 8 0 t8 0" fill="none" stroke="#C4E9F8" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  return s;
}

function bridgeH(x1: number, x2: number, y: number, S: number) {
  const a = n(x1 + S / 2 - 6), b = n(x2 - S / 2 + 6), h = 18;
  let s = `<rect x="${a}" y="${n(y - h / 2)}" width="${n(b - a)}" height="${h}" fill="#C98A4B"/>`;
  for (let px = a + 4; px < b - 1; px += 6) s += `<line x1="${n(px)}" y1="${n(y - h / 2)}" x2="${n(px)}" y2="${n(y + h / 2)}" stroke="#9C6532" stroke-width="1.5"/>`;
  return s + `<line x1="${a}" y1="${n(y - h / 2)}" x2="${b}" y2="${n(y - h / 2)}" stroke="#7A4E27" stroke-width="2.6"/><line x1="${a}" y1="${n(y + h / 2)}" x2="${b}" y2="${n(y + h / 2)}" stroke="#7A4E27" stroke-width="2.6"/>`;
}

function bridgeV(x: number, y1: number, y2: number, S: number) {
  const a = n(y1 + S / 2 - 6), b = n(y2 - S / 2 + 6), w = 18;
  let s = `<rect x="${n(x - w / 2)}" y="${a}" width="${w}" height="${n(b - a)}" fill="#C98A4B"/>`;
  for (let py = a + 4; py < b - 1; py += 6) s += `<line x1="${n(x - w / 2)}" y1="${n(py)}" x2="${n(x + w / 2)}" y2="${n(py)}" stroke="#9C6532" stroke-width="1.5"/>`;
  return s + `<line x1="${n(x - w / 2)}" y1="${a}" x2="${n(x - w / 2)}" y2="${b}" stroke="#7A4E27" stroke-width="2.6"/><line x1="${n(x + w / 2)}" y1="${a}" x2="${n(x + w / 2)}" y2="${b}" stroke="#7A4E27" stroke-width="2.6"/>`;
}

function island(x: number, y: number, S: number, isBase: boolean) {
  let s = `<rect x="${n(x)}" y="${n(y + 4)}" width="${S}" height="${S}" rx="15" fill="#D5AE69"/><rect x="${n(x)}" y="${n(y)}" width="${S}" height="${S}" rx="15" fill="#F1D79C"/><rect x="${n(x + 5)}" y="${n(y + 4)}" width="${n(S - 10)}" height="${n(S - 12)}" rx="11" fill="${isBase ? "#B6E48A" : "#9CD66B"}"/>`;
  if (!isBase)
    s += `<path d="M${n(x + 11)} ${n(y + 15)} l2.5 -4.5 l2.5 4.5 M${n(x + S - 17)} ${n(y + S - 15)} l2.5 -4.5 l2.5 4.5" fill="none" stroke="#78B84A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}

function base(cx: number, cy: number, S: number) {
  const r = S * 0.3;
  return `<ellipse cx="${n(cx)}" cy="${n(cy + S * 0.14)}" rx="${n(r)}" ry="${n(r * 0.6)}" fill="#EEF0F4" stroke="#C3CAD6" stroke-width="2"/><path d="M${n(cx - 4)} ${n(cy + S * 0.16)} V${n(cy - S * 0.32)}" stroke="#3A4660" stroke-width="3" stroke-linecap="round"/><path d="M${n(cx - 3)} ${n(cy - S * 0.32)} H${n(cx + S * 0.25)} L${n(cx + S * 0.16)} ${n(cy - S * 0.22)} L${n(cx + S * 0.25)} ${n(cy - S * 0.12)} H${n(cx - 3)} Z" fill="#22A94F" stroke="#14532D" stroke-width="1.8" stroke-linejoin="round"/>`;
}

function rock(cx: number, cy: number, S: number) {
  const p = (dx: number, dy: number) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
  return `<path d="M${p(-0.3, 0.22)} L${p(-0.26, -0.04)} L${p(-0.12, -0.22)} L${p(0.1, -0.24)} L${p(0.28, -0.06)} L${p(0.31, 0.22)} Z" fill="#9AA3AE" stroke="#5D6673" stroke-width="2.5" stroke-linejoin="round"/><path d="M${p(-0.12, -0.1)} L${p(0.02, -0.16)} L${p(0.14, -0.08)}" fill="none" stroke="#D3D9E0" stroke-width="2.5" stroke-linecap="round"/>`;
}

function gem(cx: number, cy: number, S: number) {
  const p = (dx: number, dy: number) => `${n(cx + S * dx)} ${n(cy + S * dy)}`;
  return `<path d="M${p(0, -0.26)} L${p(0.2, -0.06)} L${p(0, 0.26)} L${p(-0.2, -0.06)} Z" fill="#E4458F" stroke="#9C1F5C" stroke-width="2.2" stroke-linejoin="round"/><path d="M${p(-0.2, -0.06)} L${p(0.2, -0.06)}" stroke="#9C1F5C" stroke-width="1.5"/><path d="M${p(-0.08, -0.06)} L${p(0, 0.26)} L${p(0.08, -0.06)}" fill="none" stroke="#FF9CCB" stroke-width="1.4"/><path d="M${p(-0.06, -0.17)} L${p(-0.12, -0.08)}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"/>`;
}

function trail(pts: [number, number][], color = "#F26B1D") {
  if (pts.length < 2) return "";
  const d = "M" + pts.map((q) => `${n(q[0])} ${n(q[1])}`).join(" L");
  return `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="4.5" stroke-dasharray="7 8" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Marca de choque: círculo rojo con una cruz. */
function crashMark(x: number, y: number, r: number) {
  const k = r * 0.42;
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r + 2.5)}" fill="#FFFFFF"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#E0322B"/><path d="M${n(x - k)} ${n(y - k)} L${n(x + k)} ${n(y + k)} M${n(x + k)} ${n(y - k)} L${n(x - k)} ${n(y + k)}" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round"/>`;
}

const STEP: Record<Dir, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

/** Recorrido de un programa que falla: hasta dónde llega el robot y, si se choca, hacia dónde. */
export type Fail = { steps: Cell[]; crash?: { from: Cell; dir: Dir } };

const FAIL_RED = "#E0322B";

// ───────── mapas completos ─────────

export type Art = { w: number; h: number; svg: string };

export const MAZE = { S: 52, G: 18, P: 16 };

export function mazeArt(
  map: MazeMap,
  o: { robotAt?: Cell; robotState?: RobotState; visited?: Cell[]; showCoords?: boolean; fail?: Fail } = {},
): Art {
  const { S, G, P } = MAZE;
  const W = P * 2 + map.cols * S + (map.cols - 1) * G;
  const H = P * 2 + map.rows * S + (map.rows - 1) * G;
  const cx = (c: number) => P + (c - 1) * (S + G) + S / 2;
  const cy = (r: number) => P + (r - 1) * (S + G) + S / 2;
  let s = board(W, H, map.cols * 131 + map.rows * 17 + (map.rocks?.length ?? 0));
  for (const seg of mapEdges(map)) {
    const [a, b] = seg.split("-").map((q) => q.split(",").map(Number));
    s += a[1] === b[1] ? bridgeH(cx(a[0]), cx(b[0]), cy(a[1]), S) : bridgeV(cx(a[0]), cy(a[1]), cy(b[1]), S);
  }
  for (let r = 1; r <= map.rows; r++)
    for (let c = 1; c <= map.cols; c++) {
      s += island(cx(c) - S / 2, cy(r) - S / 2, S, map.base[0] === c && map.base[1] === r);
      if (o.showCoords) s += `<text x="${n(cx(c) - S / 2 + 6)}" y="${n(cy(r) - S / 2 + 14)}" font-size="9" fill="#3F6B2A">${c},${r}</text>`;
    }
  s += base(cx(map.base[0]), cy(map.base[1]), S);
  if (o.visited && o.visited.length > 1) s += trail(o.visited.map(([c, r]) => [cx(c), cy(r)] as [number, number]));
  if (o.fail) {
    // Recorrido del programa con error (rojo) y marca donde se choca.
    const pts = o.fail.steps.map(([c, r]) => [cx(c), cy(r)] as [number, number]);
    let end: [number, number] | null = null;
    if (o.fail.crash) {
      const [dc, dr] = STEP[o.fail.crash.dir];
      const [fc, fr] = o.fail.crash.from;
      // a mitad de camino hacia donde quiso ir, sin salirse del tablero
      const m = 14;
      end = [Math.min(W - m, Math.max(m, cx(fc) + dc * (S + G) * 0.5)), Math.min(H - m, Math.max(m, cy(fr) + dr * (S + G) * 0.5))];
      pts.push(end);
    }
    s += trail(pts, FAIL_RED);
    if (end) s += crashMark(end[0], end[1], 11);
  }
  for (const [c, r] of map.rocks ?? []) s += rock(cx(c), cy(r), S);
  for (const [c, r] of map.gems ?? []) s += gem(cx(c), cy(r), S);
  const at = o.robotAt ?? map.start;
  s += placeRobot(cx(at[0]), cy(at[1]), S * 0.88, o.robotState ?? "normal");
  return { w: W, h: H, svg: s };
}

// Lienzo: hoja cuadriculada. El robot camina por las líneas; cada flecha pinta un lado de un cuadradito.
export const DOT = 44;
const CANVAS_PAD = 24;
/** Margen izquierdo: ahí espera el robot antes de empezar, para no tapar el punto de inicio. */
const CANVAS_LEFT = 62;
export const PAINT = "#F26B1D";

export function canvasArt(
  map: CanvasMap,
  o: { robotAt?: Cell; robotState?: RobotState; trail?: Set<Seg>; showCoords?: boolean; color?: string; hideRobot?: boolean; ghost?: Set<Seg> } = {},
): Art {
  const W = CANVAS_LEFT + CANVAS_PAD + (map.cols - 1) * DOT;
  const H = CANVAS_PAD * 2 + (map.rows - 1) * DOT;
  const px = (c: number) => CANVAS_LEFT + (c - 1) * DOT;
  const py = (r: number) => CANVAS_PAD + (r - 1) * DOT;
  const x0 = px(1), x1 = px(map.cols), y0 = py(1), y1 = py(map.rows);
  let s = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#FFFDF6" stroke="#EADFC8" stroke-width="2"/>`;
  for (let c = 1; c <= map.cols; c++) s += `<line x1="${px(c)}" y1="${y0}" x2="${px(c)}" y2="${y1}" stroke="#E7DCC4" stroke-width="2"/>`;
  for (let r = 1; r <= map.rows; r++) s += `<line x1="${x0}" y1="${py(r)}" x2="${x1}" y2="${py(r)}" stroke="#E7DCC4" stroke-width="2"/>`;
  for (let r = 1; r <= map.rows; r++)
    for (let c = 1; c <= map.cols; c++) {
      s += `<circle cx="${px(c)}" cy="${py(r)}" r="3" fill="#D2C5A8"/>`;
      if (o.showCoords) s += `<text x="${px(c) + 4}" y="${py(r) - 5}" font-size="8" fill="#A99E86">${c},${r}</text>`;
    }
  // Figura objetivo, tenue, debajo de lo que va pintando el robot (animaciones de práctica).
  for (const seg of o.ghost ?? []) {
    const [a, b] = seg.split("-").map((q) => q.split(",").map(Number));
    s += `<line x1="${px(a[0])}" y1="${py(a[1])}" x2="${px(b[0])}" y2="${py(b[1])}" stroke="${PAINT}" stroke-opacity="0.22" stroke-width="8" stroke-linecap="round"/>`;
  }
  const color = o.color ?? PAINT;
  const segs = o.trail ?? targetTrail(map);
  const nodes = new Set<string>();
  for (const seg of segs) {
    const [a, b] = seg.split("-").map((q) => q.split(",").map(Number));
    s += `<line x1="${px(a[0])}" y1="${py(a[1])}" x2="${px(b[0])}" y2="${py(b[1])}" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;
    nodes.add(`${a[0]},${a[1]}`).add(`${b[0]},${b[1]}`);
  }
  // Puntitos en cada esquina de la figura: ayudan a contar los pasos.
  for (const k of nodes) {
    const [c, r] = k.split(",").map(Number);
    s += `<circle cx="${px(c)}" cy="${py(r)}" r="2.4" fill="#FFFFFF" fill-opacity="0.9"/>`;
  }
  // Punto de inicio.
  const [sc, sr] = map.start;
  s += `<circle cx="${px(sc)}" cy="${py(sr)}" r="9" fill="#22A94F" stroke="#FFFFFF" stroke-width="3"/>`;
  if (!o.hideRobot) {
    if (o.robotAt) s += placeRobot(px(o.robotAt[0]), py(o.robotAt[1]) - 2, 38, o.robotState ?? "normal");
    else s += placeRobot(px(sc) - 34, Math.max(py(sr) - 4, 27), 44, o.robotState ?? "normal");
  }
  return { w: W, h: H, svg: s };
}

export { edgeKey };
