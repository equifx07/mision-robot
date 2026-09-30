// Bloques de programación con el estilo "Encastre" (opción A del canvas de diseño).
// Volumen: cara con luz arriba, banda inferior oscura, muesca arriba a la izquierda y
// pestaña solo en el último bloque de cada pila. Ver docs/diseno/.

import type { CSSProperties, ReactNode } from "react";
import type { Block, Cond, Dir, Program } from "@/lib/model";
import { DIR_NAME } from "@/lib/model";

export type BlockSize = "normal" | "compact";
export type Fam = "move" | "loop" | "cond" | "func";

export const FAM: Record<Fam, { L: string; F: string; D: string; T: string }> = {
  move: { L: "#3F8EF2", F: "#176CE0", D: "#0D55BF", T: "#FFFFFF" },
  loop: { L: "#FFC04A", F: "#FEA814", D: "#C67505", T: "#2D1700" },
  cond: { L: "#1E9A52", F: "#0F8743", D: "#0A6231", T: "#FFFFFF" },
  func: { L: "#D2509A", F: "#C33582", D: "#96205D", T: "#FFFFFF" },
};
const INK = "#1B2338";
const RUN_GLOW = "0 0 0 4px #F9E45A, 0 0 22px rgba(254, 222, 110, 0.95)";
const CHANGED: CSSProperties = { outline: "3px dashed #1F2B45", outlineOffset: 3 };
/** Brillo dorado que sigue la forma del bloque: la pieza que eligió el chico. */
export const PICK_GLOW = "drop-shadow(0 0 0.6px #A87C00) drop-shadow(0 0 2.5px #FFC21A) drop-shadow(0 0 7px rgba(255, 194, 26, 0.95))";
const HOLE_BG = "#FFF3B8";
const HOLE_LINE = "#D39B00";
const DROP = "0 2px 4px rgba(20, 32, 64, 0.18)";

type M = {
  h: number; moveW: number; headerH: number; elseH: number; armW: number; footerH: number; footerW: number; r: number;
  padH: number; fs: number; arrow: number; loop: number; flag: number; band: number; shift: number; gap: number;
  pillH: number; pillFs: number; pillPad: number; pillTip: number; numH: number; numMinW: number;
  cw: number; cx: number; nh: number; th: number; mouthBottom: number; capW: number; capH: number; holeFs: number; holeW: number;
};

const SIZES: Record<BlockSize, M> = {
  normal: {
    h: 44, moveW: 50, headerH: 48, elseH: 38, armW: 22, footerH: 20, footerW: 98, r: 10, padH: 14, fs: 17, arrow: 24, loop: 22, flag: 22, band: 5, shift: 4, gap: 8,
    pillH: 32, pillFs: 16, pillPad: 17, pillTip: 12, numH: 30, numMinW: 38, cw: 18, cx: 10, nh: 5, th: 7, mouthBottom: 5, capW: 96, capH: 22, holeFs: 24, holeW: 76,
  },
  compact: {
    h: 32, moveW: 36, headerH: 36, elseH: 28, armW: 15, footerH: 12, footerW: 72, r: 8, padH: 10, fs: 14, arrow: 17, loop: 16, flag: 16, band: 4, shift: 3, gap: 6,
    pillH: 24, pillFs: 13, pillPad: 12, pillTip: 9, numH: 22, numMinW: 28, cw: 14, cx: 8, nh: 4, th: 6, mouthBottom: 3, capW: 72, capH: 16, holeFs: 18, holeW: 56,
  },
};

type State = "running" | "changed" | "picked" | undefined;

// ───────── Filas planas (índices para resaltar bloques) ─────────

export function flattenRows(program: Program): string[] {
  const rows: string[] = [];
  const condLabel = (cnd: Cond) => (cnd.kind === "hole" ? "?" : `${cnd.kind}${cnd.dir}`);
  const walk = (blocks: Block[], depth: number) => {
    for (const b of blocks) {
      switch (b.t) {
        case "move":
          rows.push(`${depth}:move${b.dir}`);
          break;
        case "repeat":
          rows.push(`${depth}:repeat${b.n}`);
          walk(b.body, depth + 1);
          break;
        case "until":
          rows.push(`${depth}:until`);
          walk(b.body, depth + 1);
          break;
        case "while":
          rows.push(`${depth}:while${condLabel(b.cond)}`);
          walk(b.body, depth + 1);
          break;
        case "if":
          rows.push(`${depth}:if${condLabel(b.cond)}`);
          walk(b.then, depth + 1);
          if (b.else) {
            rows.push(`${depth}:else`);
            walk(b.else, depth + 1);
          }
          break;
        case "call":
          rows.push(`${depth}:call${b.name}`);
          break;
        case "hole":
          rows.push(`${depth}:hole`);
          break;
      }
    }
  };
  for (const d of program.defs ?? []) {
    rows.push(`0:def${d.name}`);
    walk(d.body, 1);
  }
  walk(program.main, 0);
  return rows;
}

/** Índices de filas de `b` que difieren de `a` (posicional). */
export function diffRows(a: Program, b: Program): Set<number> {
  const ra = flattenRows(a);
  const rb = flattenRows(b);
  const out = new Set<number>();
  if (ra.length === rb.length) {
    rb.forEach((r, i) => {
      if (r !== ra[i]) out.add(i);
    });
    return out;
  }
  let first = 0;
  while (first < ra.length && first < rb.length && ra[first] === rb[first]) first++;
  let tailA = ra.length - 1;
  let tailB = rb.length - 1;
  while (tailA >= first && tailB >= first && ra[tailA] === rb[tailB]) {
    tailA--;
    tailB--;
  }
  for (let i = first; i <= Math.max(tailB, first); i++) if (i < rb.length) out.add(i);
  return out;
}

function rowsIn(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    switch (b.t) {
      case "move":
      case "call":
      case "hole":
        n += 1;
        break;
      case "repeat":
      case "until":
      case "while":
        n += 1 + rowsIn(b.body);
        break;
      case "if":
        n += 1 + rowsIn(b.then) + (b.else ? 1 + rowsIn(b.else) : 0);
        break;
    }
  }
  return n;
}

// ───────── Íconos ─────────

const ROT: Record<Dir, number> = { R: 0, D: 90, L: 180, U: 270 };
const trap = (w: number, h: number) => `M0 0 H${w} L${w - 3} ${h - 1.4} Q${w - 3.8} ${h} ${w - 5.4} ${h} H5.4 Q3.8 ${h} 3 ${h - 1.4} Z`;

function BigArrow({ dir, size, color }: { dir: Dir; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }} aria-hidden>
      <g transform={`rotate(${ROT[dir]} 12 12)`}>
        <path d="M3.5 9.3 H12 V4.8 L20.6 12 L12 19.2 V14.7 H3.5 Z" fill={color} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function SmallArrow({ dir, size, color }: { dir: Dir; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }} aria-label={DIR_NAME[dir]}>
      <g transform={`rotate(${ROT[dir]} 12 12)`}>
        <path d="M4.5 12 H18.5 M13 6.5 L18.5 12 L13 17.5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function LoopIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v5h-5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlagIcon({ size, pole }: { size: number; pole: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }} aria-label="base">
      <path d="M6 21.5 V3" stroke={pole} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M6.5 3.8 H19 L15.2 8.6 L19 13.4 H6.5 Z" fill="#10B955" stroke={pole} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

function RockIcon({ h }: { h: number }) {
  return (
    <svg width={(h * 24) / 18} height={h} viewBox="0 0 24 18" style={{ display: "block", flexShrink: 0 }} aria-hidden>
      <path d="M2 16.5 L3.6 8.6 L8.4 3.6 L15 3.4 L20.6 8 L22 16.5 Z" fill="#8D8F93" stroke="#5D6168" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M7.6 8.6 L11.4 6.4 L15 7.8" fill="none" stroke="#D4D6DA" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function PathIcon({ h }: { h: number }) {
  return (
    <svg width={(h * 40) / 18} height={h} viewBox="0 0 40 18" style={{ display: "block", flexShrink: 0 }} aria-hidden>
      <rect x="13" y="5.5" width="14" height="7" fill="#AD6F2F" />
      <path d="M16.5 5.5 V12.5 M20 5.5 V12.5 M23.5 5.5 V12.5" stroke="#7A4A1C" strokeWidth={1.1} />
      <rect x="1" y="1.5" width="14" height="15" rx="4" fill="#5CC84A" stroke="#3B8F2E" strokeWidth={1.5} />
      <rect x="25" y="1.5" width="14" height="15" rx="4" fill="#5CC84A" stroke="#3B8F2E" strokeWidth={1.5} />
    </svg>
  );
}

// ───────── Piezas ─────────

function Notch({ m }: { m: M }) {
  return (
    <svg width={m.cw} height={m.nh} viewBox={`0 0 ${m.cw} ${m.nh}`} style={{ position: "absolute", left: m.cx, top: 0, display: "block" }} aria-hidden>
      <path d={trap(m.cw, m.nh)} fill="rgba(6, 18, 48, 0.3)" />
    </svg>
  );
}

function Tab({ m, fill }: { m: M; fill: string }) {
  return (
    <svg width={m.cw} height={m.th} viewBox={`0 0 ${m.cw} ${m.th}`} style={{ position: "absolute", left: m.cx, bottom: -(m.th - 1), zIndex: 2, display: "block" }} aria-hidden>
      <path d={trap(m.cw, m.th)} fill={fill} />
    </svg>
  );
}

function Badge() {
  return (
    <span
      aria-label="cambio"
      style={{ position: "absolute", right: -12, top: -12, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 999, background: "#1F2B45", color: "#FFFFFF", fontSize: 14, fontWeight: 700, lineHeight: 1 }}
    >
      !
    </span>
  );
}

function Txt({ fam, m, children }: { fam: Fam; m: M; children: ReactNode }) {
  return <span style={{ color: FAM[fam].T, fontSize: m.fs, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1 }}>{children}</span>;
}

function Num({ m, children }: { m: M; children: ReactNode }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", minWidth: m.numMinW, height: m.numH, padding: `0 ${Math.round(m.numH * 0.36)}px`, background: "#FFFFFF", borderRadius: 999, color: INK, fontSize: m.fs, fontWeight: 700, lineHeight: 1 }}
    >
      {children}
    </span>
  );
}

function Pill({ m, hole, children }: { m: M; hole?: boolean; children: ReactNode }) {
  const t = m.pillTip;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, height: m.pillH, padding: `0 ${m.pillPad}px`,
        background: hole ? "#FFE27A" : "#FFFFFF",
        clipPath: `polygon(${t}px 0, calc(100% - ${t}px) 0, 100% 50%, calc(100% - ${t}px) 100%, ${t}px 100%, 0 50%)`,
        color: INK, fontSize: m.pillFs, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

/** Hacia dónde mira la condición, en palabras: "a la derecha", "arriba"… */
const DIR_PHRASE: Record<Dir, string> = { R: "a la derecha", L: "a la izquierda", U: "arriba", D: "abajo" };

/** Texto de una condición: "roca a la derecha", "camino abajo". */
export function condText(cond: Cond): string {
  if (cond.kind === "hole") return "?";
  return `${cond.kind === "rock" ? "roca" : "camino"} ${DIR_PHRASE[cond.dir]}`;
}

const PILL_ICON = 0.62;

function CondPill({ cond, m }: { cond: Cond; m: M }) {
  if (cond.kind === "hole")
    return (
      <Pill m={m} hole>
        <span style={{ padding: "0 10px", fontSize: m.pillFs + 3, fontWeight: 800, color: "#8A6500" }}>?</span>
      </Pill>
    );
  const ih = Math.round(m.pillH * PILL_ICON);
  return (
    <Pill m={m}>
      <span>{condText(cond)}</span>
      <SmallArrow dir={cond.dir} size={m.pillFs + 1} color={INK} />
      {cond.kind === "rock" ? <RockIcon h={ih} /> : <PathIcon h={ih} />}
    </Pill>
  );
}

function stackFace(fam: Fam, m: M, state: State): CSSProperties {
  const f = FAM[fam];
  return {
    background: `linear-gradient(180deg, ${f.L} 0%, ${f.F} 42%)`,
    borderRadius: m.r,
    boxShadow: [`inset 0 -${m.band}px 0 ${f.D}`, "inset 0 1.5px 0 rgba(255, 255, 255, 0.45)", DROP, state === "running" ? RUN_GLOW : ""].filter(Boolean).join(", "),
    ...(state === "changed" ? CHANGED : {}),
    ...(state === "picked" ? { filter: PICK_GLOW } : {}),
  };
}

function StackShell({ fam, m, minW, padX, last, state, label, children }: { fam: Fam; m: M; minW: number; padX: number; last?: boolean; state?: State; label?: string; children: ReactNode }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxSizing: "border-box", minWidth: minW, height: m.h, padding: `0 ${padX}px ${m.shift}px`, whiteSpace: "nowrap", flexShrink: 0, ...stackFace(fam, m, state) }}
    >
      <Notch m={m} />
      {children}
      {last && <Tab m={m} fill={FAM[fam].D} />}
      {state === "changed" && <Badge />}
    </div>
  );
}

function MoveBlock({ dir, m, last, state }: { dir: Dir; m: M; last?: boolean; state?: State }) {
  return (
    <StackShell fam="move" m={m} minW={m.moveW} padX={0} last={last} state={state} label={`mover a la ${DIR_NAME[dir]}`.replace("a la arriba", "arriba").replace("a la abajo", "abajo")}>
      <BigArrow dir={dir} size={m.arrow} color={FAM.move.T} />
    </StackShell>
  );
}

function Hole({ m }: { m: M }) {
  return (
    <div
      aria-label="hueco para completar"
      style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", width: m.holeW, height: m.h, border: `2.5px dashed ${HOLE_LINE}`, borderRadius: m.r, background: HOLE_BG, color: "#8A6500", fontSize: m.holeFs, fontWeight: 800, lineHeight: 1, flexShrink: 0 }}
    >
      ?
    </div>
  );
}

function Head({ fam, m, state, hat, variant = "head", radius, children }: { fam: Fam; m: M; state?: State; hat?: boolean; variant?: "head" | "else"; radius: string; children: ReactNode }) {
  const f = FAM[fam];
  const isElse = variant === "else";
  return (
    <div
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: m.gap, boxSizing: "border-box",
        minHeight: isElse ? m.elseH : m.headerH, padding: isElse ? `0 ${m.padH + 4}px 0 ${m.padH}px` : `0 ${m.padH}px`, whiteSpace: "nowrap", borderRadius: radius,
        background: isElse ? f.F : `linear-gradient(180deg, ${f.L} 0%, ${f.F} 45%)`,
        boxShadow: [hat || isElse ? "" : "inset 0 1.5px 0 rgba(255, 255, 255, 0.45)", isElse ? "" : "0 2px 4px rgba(20, 32, 64, 0.16)", state === "running" ? RUN_GLOW : ""].filter(Boolean).join(", ") || "none",
        ...(state === "changed" ? CHANGED : {}),
        ...(state === "picked" ? { filter: PICK_GLOW, zIndex: 1 } : {}),
      }}
    >
      {!hat && !isElse && <Notch m={m} />}
      {children}
      <span aria-hidden style={{ position: "absolute", left: m.armW, right: 0, bottom: 0, height: 3, background: "rgba(0, 0, 0, 0.13)", borderBottomRightRadius: m.r }} />
      {state === "changed" && <Badge />}
    </div>
  );
}

function Mouth({ fam, m, children }: { fam: Fam; m: M; children: ReactNode }) {
  const f = FAM[fam];
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <div style={{ width: m.armW, flexShrink: 0, background: f.F, boxShadow: "inset -3px 0 0 rgba(0, 0, 0, 0.07)" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingBottom: m.mouthBottom, minHeight: Math.round(m.h * 0.5) }}>
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ position: "absolute", left: 0, top: 0, display: "block" }} aria-hidden>
          <path d="M0 0 H8 A8 8 0 0 0 0 8 Z" fill={f.F} />
        </svg>
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ position: "absolute", left: 0, bottom: 0, display: "block" }} aria-hidden>
          <path d="M0 8 V0 A8 8 0 0 0 8 8 Z" fill={f.F} />
        </svg>
        {children}
      </div>
    </div>
  );
}

function Foot({ fam, m, last }: { fam: Fam; m: M; last?: boolean }) {
  const f = FAM[fam];
  return (
    <div
      style={{ position: "relative", boxSizing: "border-box", width: m.footerW, height: m.footerH, borderRadius: `0 ${m.r}px ${m.r}px ${m.r}px`, background: f.F, boxShadow: `inset 0 -${m.band}px 0 ${f.D}, inset 0 1.5px 0 rgba(255, 255, 255, 0.35), ${DROP}` }}
    >
      {last && <Tab m={m} fill={f.D} />}
    </div>
  );
}

function Cap({ fam, m }: { fam: Fam; m: M }) {
  return (
    <svg width={m.capW} height={m.capH} viewBox="0 0 96 22" preserveAspectRatio="none" style={{ display: "block", marginBottom: -1 }} aria-hidden>
      <path d="M0 22.5 L0 14 Q0 0 14 0 L52 0 C64 0 70 5 76 11 C82 17 87 20.5 96 21 L96 22.5 Z" fill={FAM[fam].L} />
      <path d="M3.5 12.5 Q4.5 3.5 14 3.5 L50 3.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ───────── Composición ─────────

type Ctx = { m: M; changed?: Set<number>; running?: Set<number>; picked?: Set<number>; inPick?: boolean };
const stateOf = (ctx: Ctx, i: number): State =>
  ctx.running?.has(i) ? "running" : !ctx.inPick && ctx.picked?.has(i) ? "picked" : ctx.changed?.has(i) ? "changed" : undefined;

/** ¿Todas las filas del bloque que empieza en `start` están elegidas? Entonces brilla la pieza entera. */
function wholePicked(ctx: Ctx, b: Block, start: number): boolean {
  if (ctx.inPick || !ctx.picked || b.t === "move" || b.t === "call" || b.t === "hole") return false;
  const n = rowsIn([b]);
  for (let i = start; i < start + n; i++) if (!ctx.picked.has(i)) return false;
  return true;
}

function Glow({ children }: { children: ReactNode }) {
  return <div style={{ position: "relative", zIndex: 1, filter: PICK_GLOW, display: "flex", flexDirection: "column", alignItems: "flex-start", flexShrink: 0 }}>{children}</div>;
}

/** Encabezado suelto (bloque con el cuerpo vacío): se usa para mostrar un cambio, p. ej. "repetir 3 veces". */
function HeadOnly({ fam, m, state, children }: { fam: Fam; m: M; state?: State; children: ReactNode }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: m.gap, boxSizing: "border-box", minHeight: m.headerH, padding: `0 ${m.padH}px ${Math.round(m.band / 2)}px`, whiteSpace: "nowrap", flexShrink: 0, ...stackFace(fam, m, state) }}>
      <Notch m={m} />
      {children}
    </div>
  );
}

function CBlock({ fam, head, body, start, ctx, last, hat }: { fam: Fam; head: ReactNode; body: Block[]; start: number; ctx: Ctx; last?: boolean; hat?: boolean }) {
  const m = ctx.m;
  const r = `${m.r}px`;
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", flexShrink: 0 }}>
      {hat && <Cap fam={fam} m={m} />}
      <Head fam={fam} m={m} state={stateOf(ctx, start)} hat={hat} radius={hat ? `0 ${r} ${r} 0` : `${r} ${r} ${r} 0`}>
        {head}
      </Head>
      <Mouth fam={fam} m={m}>
        <Stack blocks={body} start={start + 1} ctx={ctx} />
      </Mouth>
      <Foot fam={fam} m={m} last={last} />
    </div>
  );
}

function IfElse({ head, thenB, elseB, start, ctx, last }: { head: ReactNode; thenB: Block[]; elseB: Block[]; start: number; ctx: Ctx; last?: boolean }) {
  const m = ctx.m;
  const r = `${m.r}px`;
  const elseIdx = start + 1 + rowsIn(thenB);
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", flexShrink: 0 }}>
      <Head fam="cond" m={m} state={stateOf(ctx, start)} radius={`${r} ${r} ${r} 0`}>
        {head}
      </Head>
      <Mouth fam="cond" m={m}>
        <Stack blocks={thenB} start={start + 1} ctx={ctx} />
      </Mouth>
      <Head fam="cond" m={m} state={stateOf(ctx, elseIdx)} variant="else" radius={`0 ${r} ${r} 0`}>
        <Txt fam="cond" m={m}>
          si no
        </Txt>
      </Head>
      <Mouth fam="cond" m={m}>
        <Stack blocks={elseB} start={elseIdx + 1} ctx={ctx} />
      </Mouth>
      <Foot fam="cond" m={m} last={last} />
    </div>
  );
}

function loopHead(b: Extract<Block, { t: "repeat" | "until" | "while" }>, m: M): ReactNode {
  if (b.t === "repeat")
    return (
      <>
        <LoopIcon size={m.loop} color={FAM.loop.T} />
        <Txt fam="loop" m={m}>
          repetir
        </Txt>
        <Num m={m}>{b.n}</Num>
        <Txt fam="loop" m={m}>
          veces
        </Txt>
      </>
    );
  if (b.t === "until")
    return (
      <>
        <LoopIcon size={m.loop} color={FAM.loop.T} />
        <Txt fam="loop" m={m}>
          repetir hasta la base
        </Txt>
        <FlagIcon size={m.flag} pole={FAM.loop.T} />
      </>
    );
  return (
    <>
      <LoopIcon size={m.loop} color={FAM.loop.T} />
      <Txt fam="loop" m={m}>
        mientras haya
      </Txt>
      <CondPill cond={b.cond} m={m} />
    </>
  );
}

function BlockEl({ b, start, ctx, last }: { b: Block; start: number; ctx: Ctx; last?: boolean }) {
  const m = ctx.m;
  if (wholePicked(ctx, b, start)) {
    return (
      <Glow>
        <BlockEl b={b} start={start} ctx={{ ...ctx, inPick: true }} last={last} />
      </Glow>
    );
  }
  switch (b.t) {
    case "move":
      return <MoveBlock dir={b.dir} m={m} last={last} state={stateOf(ctx, start)} />;
    case "call":
      return (
        <StackShell fam="func" m={m} minW={0} padX={m.padH + 4} last={last} state={stateOf(ctx, start)}>
          <Txt fam="func" m={m}>
            {b.name}
          </Txt>
        </StackShell>
      );
    case "hole":
      return <Hole m={m} />;
    case "repeat":
    case "until":
    case "while":
      if (b.body.length === 0)
        return (
          <HeadOnly fam="loop" m={m} state={stateOf(ctx, start)}>
            {loopHead(b, m)}
          </HeadOnly>
        );
      return <CBlock fam="loop" start={start} ctx={ctx} last={last} body={b.body} head={loopHead(b, m)} />;
    case "if": {
      const head = (
        <>
          <Txt fam="cond" m={m}>
            si hay
          </Txt>
          <CondPill cond={b.cond} m={m} />
        </>
      );
      if (b.then.length === 0 && !b.else?.length)
        return (
          <HeadOnly fam="cond" m={m} state={stateOf(ctx, start)}>
            {head}
          </HeadOnly>
        );
      return b.else ? (
        <IfElse head={head} thenB={b.then} elseB={b.else} start={start} ctx={ctx} last={last} />
      ) : (
        <CBlock fam="cond" start={start} ctx={ctx} last={last} body={b.then} head={head} />
      );
    }
  }
}

/** Pila vertical de bloques: siempre uno enganchado debajo del otro, en el orden en que se ejecutan. */
function Stack({ blocks, start, ctx }: { blocks: Block[]; start: number; ctx: Ctx }) {
  const items: ReactNode[] = [];
  let idx = start;
  blocks.forEach((b, i) => {
    items.push(<BlockEl key={`b${idx}`} b={b} start={idx} ctx={ctx} last={i === blocks.length - 1} />);
    idx += rowsIn([b]);
  });
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>{items}</div>;
}

// ───────── Medidas aproximadas (para elegir cuántas columnas de opciones entran) ─────────

const CHAR_W = 0.56; // ancho medio de un carácter de Fredoka en negrita, en unidades del tamaño de letra
const textW = (t: string, fs: number) => t.length * fs * CHAR_W;

function pillW(cond: Cond, m: M): number {
  if (cond.kind === "hole") return m.pillFs + 23 + m.pillPad * 2;
  const ih = m.pillH * PILL_ICON;
  const icon = cond.kind === "rock" ? (ih * 24) / 18 : (ih * 40) / 18;
  return m.pillPad * 2 + textW(condText(cond), m.pillFs) + 5 + m.pillFs + 1 + 5 + icon;
}

function headW(b: Block, m: M): number {
  const g = m.gap;
  switch (b.t) {
    case "repeat":
      return m.padH * 2 + m.loop + g + textW("repetir", m.fs) + g + m.numMinW + g + textW("veces", m.fs);
    case "until":
      return m.padH * 2 + m.loop + g + textW("repetir hasta la base", m.fs) + g + m.flag;
    case "while":
      return m.padH * 2 + m.loop + g + textW("mientras haya", m.fs) + g + pillW(b.cond, m);
    case "if":
      return m.padH * 2 + textW("si hay", m.fs) + g + pillW(b.cond, m);
    default:
      return 0;
  }
}

type Size = { w: number; h: number };

function measureStack(blocks: Block[], m: M): Size {
  let w = 0;
  let h = 0;
  for (const b of blocks) {
    const s = measureBlock(b, m);
    w = Math.max(w, s.w);
    h += s.h;
  }
  return { w, h };
}

function measureBlock(b: Block, m: M): Size {
  const mouth = (body: Block[]) => {
    const s = measureStack(body, m);
    return { w: m.armW + s.w, h: Math.max(s.h, Math.round(m.h * 0.5)) + m.mouthBottom };
  };
  switch (b.t) {
    case "move":
      return { w: m.moveW, h: m.h };
    case "call":
      return { w: m.padH * 2 + 8 + textW(b.name, m.fs), h: m.h };
    case "hole":
      return { w: m.holeW, h: m.h };
    case "repeat":
    case "until":
    case "while": {
      if (b.body.length === 0) return { w: headW(b, m), h: m.headerH };
      const body = mouth(b.body);
      return { w: Math.max(headW(b, m), body.w, m.footerW), h: m.headerH + body.h + m.footerH };
    }
    case "if": {
      if (b.then.length === 0 && !b.else?.length) return { w: headW(b, m), h: m.headerH };
      const t = mouth(b.then);
      const e = b.else ? mouth(b.else) : { w: 0, h: 0 };
      return { w: Math.max(headW(b, m), t.w, e.w, m.footerW), h: m.headerH + t.h + (b.else ? m.elseH + e.h : 0) + m.footerH };
    }
  }
}

/** Tamaño aproximado en píxeles con que se dibuja un programa. */
export function measureProgram(program: Program, size: BlockSize = "normal"): Size {
  const m = SIZES[size];
  const parts: Size[] = [];
  for (const d of program.defs ?? []) {
    const def = measureBlock({ t: "repeat", n: 0, body: d.body }, m);
    parts.push({ w: Math.max(def.w, m.capW), h: def.h + m.capH });
  }
  if (program.main.length) parts.push(measureStack(program.main, m));
  let w = 0;
  let h = 0;
  parts.forEach((p, i) => {
    w = Math.max(w, p.w);
    h += p.h + (i > 0 ? Math.round(m.h * 0.5) : 0);
  });
  return { w: Math.ceil(w), h: Math.ceil(h + m.th) };
}

/** Tamaño aproximado de un CondChip. */
export function measureCondChip(cond: Cond, word: string, size: BlockSize = "normal"): Size {
  const m = SIZES[size];
  return { w: Math.ceil(m.padH * 2 + textW(word, m.fs) + m.gap + pillW(cond, m)), h: m.headerH };
}

// ───────── API pública ─────────

type Props = {
  program: Program;
  /** Filas cambiadas respecto del programa dado (revisión). */
  changed?: Set<number>;
  /** Fila que se está ejecutando (animación). */
  running?: Set<number>;
  /** Filas que eligió el chico (la pieza puesta en el hueco o el cambio aplicado): brillan en dorado. */
  picked?: Set<number>;
  size?: BlockSize;
  className?: string;
};

export function ProgramView({ program, changed, running, picked, size = "normal", className }: Props) {
  const m = SIZES[size];
  const ctx: Ctx = { m, changed, running, picked };
  let idx = 0;
  const defs = (program.defs ?? []).map((d) => {
    const here = idx;
    idx += 1 + rowsIn(d.body);
    return (
      <CBlock
        key={`def-${d.name}`}
        fam="func"
        hat
        start={here}
        ctx={ctx}
        last
        body={d.body}
        head={
          <>
            <Txt fam="func" m={m}>
              definir
            </Txt>
            <Num m={m}>{d.name}</Num>
          </>
        }
      />
    );
  });
  return (
    <div className={className} style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: defs.length ? Math.round(m.h * 0.5) : 0, paddingBottom: m.th }}>
      {defs}
      {program.main.length > 0 && <Stack blocks={program.main} start={idx} ctx={ctx} />}
    </div>
  );
}

/** Vista de una pieza suelta (opción de completar o de arreglar). */
export function PieceView({ blocks, size = "normal" }: { blocks: Block[]; size?: BlockSize }) {
  return <ProgramView program={{ main: blocks }} size={size} />;
}

/** Opción de condición para completar: "si hay [roca a la derecha → (roca)]". */
export function CondChip({ cond, word = "si hay", size = "normal" }: { cond: Cond; word?: string; size?: BlockSize }) {
  const m = SIZES[size];
  const fam: Fam = word.startsWith("mientras") ? "loop" : "cond";
  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: m.gap, boxSizing: "border-box", minHeight: m.headerH, padding: `0 ${m.padH}px ${Math.round(m.band / 2)}px`, whiteSpace: "nowrap", ...stackFace(fam, m, undefined) }}
    >
      <Txt fam={fam} m={m}>
        {word}
      </Txt>
      <CondPill cond={cond} m={m} />
    </div>
  );
}

/** Bloque de muestra con texto (leyenda del tutorial). */
export function BlockChip({ fam, size = "normal", children }: { fam: Fam; size?: BlockSize; children: ReactNode }) {
  const m = SIZES[size];
  return (
    <StackShell fam={fam} m={m} minW={0} padX={m.padH + 2} last>
      <Txt fam={fam} m={m}>
        {children}
      </Txt>
    </StackShell>
  );
}

