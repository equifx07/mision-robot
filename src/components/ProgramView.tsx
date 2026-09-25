import type { Block, Cond, Dir, Program } from "@/lib/model";
import { DIR_ARROW } from "@/lib/model";

// ───────── Filas planas (para resaltar diferencias entre programas) ─────────

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
  // Alineación simple: si tienen el mismo largo, comparar posición a posición;
  // si no, marcar desde la primera diferencia hasta el final del más largo.
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

// ───────── Iconos ─────────

function RockIcon() {
  return (
    <svg width="16" height="16" viewBox="-20 -20 40 40" aria-hidden className="inline-block align-[-3px]">
      <polygon points="-18,8 -14,-6 -4,-14 8,-13 17,-4 18,8 10,15 -8,15" fill="#9ca3af" stroke="#374151" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 36 28" aria-hidden className="inline-block align-[-2px]">
      <rect x="1" y="4" width="14" height="20" rx="4" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5" />
      <rect x="21" y="4" width="14" height="20" rx="4" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5" />
      <rect x="13" y="10" width="10" height="8" fill="#94a3b8" />
    </svg>
  );
}

function BaseIcon() {
  return (
    <svg width="14" height="16" viewBox="-10 -18 26 36" aria-hidden className="inline-block align-[-3px]">
      <line x1="-6" y1="-16" x2="-6" y2="16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <polygon points="-6,-16 14,-9 -6,-2" fill="#bbf7d0" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

function Arrow({ dir, big }: { dir: Dir; big?: boolean }) {
  return <span className={big ? "text-2xl leading-none font-bold" : "text-lg leading-none font-bold"}>{DIR_ARROW[dir]}</span>;
}

export function CondLabel({ cond }: { cond: Cond }) {
  if (cond.kind === "hole")
    return (
      <span className="inline-flex items-center justify-center rounded-md border-2 border-dashed border-white/80 bg-white/20 px-2 text-base font-bold">
        ?
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>hay</span>
      {cond.kind === "rock" ? <RockIcon /> : <PathIcon />}
      <span>{cond.kind === "rock" ? "roca" : "camino"}</span>
      <Arrow dir={cond.dir} />
    </span>
  );
}

// ───────── Render de bloques ─────────
// Los índices de fila se calculan de forma pura (sin contadores mutables) para que
// el render sea idéntico en servidor y cliente.

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

type Ctx = { highlight?: Set<number>; compact?: boolean };

function rowCls(ctx: Ctx, idx: number, base: string) {
  const hl = ctx.highlight?.has(idx);
  return `${base} ${hl ? "ring-4 ring-yellow-300 ring-offset-1" : ""}`;
}

const HEAD = "flex items-center gap-1.5 rounded-lg px-2.5 text-white font-semibold whitespace-nowrap";
const LEAF = "inline-flex items-center justify-center rounded-lg text-white";

function Body({ children, color }: { children: React.ReactNode; color: string }) {
  return <div className={`ml-3 flex flex-col gap-1 border-l-4 pl-2 py-1 ${color}`}>{children}</div>;
}

function Blocks({ blocks, start, ctx }: { blocks: Block[]; start: number; ctx: Ctx }) {
  const h = ctx.compact ? "h-7 text-[13px]" : "h-8 text-sm";
  const leafSize = ctx.compact ? "h-7 w-9" : "h-8 w-10";
  let idx = start;
  const out: React.ReactNode[] = [];
  blocks.forEach((b, k) => {
    const here = idx;
    switch (b.t) {
      case "move":
        out.push(
          <div key={k} className={rowCls(ctx, here, `${LEAF} ${leafSize} bg-sky-500`)}>
            <Arrow dir={b.dir} big={!ctx.compact} />
          </div>,
        );
        idx += 1;
        break;
      case "repeat":
        out.push(
          <div key={k} className="flex flex-col gap-1">
            <div className={rowCls(ctx, here, `${HEAD} ${h} bg-amber-500`)}>
              <span aria-hidden>↻</span> repetir <span className="rounded bg-white/25 px-1.5">{b.n}</span> veces
            </div>
            <Body color="border-amber-400">
              <Blocks blocks={b.body} start={here + 1} ctx={ctx} />
            </Body>
          </div>,
        );
        idx += 1 + rowsIn(b.body);
        break;
      case "until":
        out.push(
          <div key={k} className="flex flex-col gap-1">
            <div className={rowCls(ctx, here, `${HEAD} ${h} bg-amber-600`)}>
              <span aria-hidden>↻</span> repetir hasta llegar a la base <BaseIcon />
            </div>
            <Body color="border-amber-500">
              <Blocks blocks={b.body} start={here + 1} ctx={ctx} />
            </Body>
          </div>,
        );
        idx += 1 + rowsIn(b.body);
        break;
      case "while":
        out.push(
          <div key={k} className="flex flex-col gap-1">
            <div className={rowCls(ctx, here, `${HEAD} ${h} bg-amber-600`)}>
              <span aria-hidden>↻</span> mientras <CondLabel cond={b.cond} />
            </div>
            <Body color="border-amber-500">
              <Blocks blocks={b.body} start={here + 1} ctx={ctx} />
            </Body>
          </div>,
        );
        idx += 1 + rowsIn(b.body);
        break;
      case "if": {
        const elseIdx = here + 1 + rowsIn(b.then);
        out.push(
          <div key={k} className="flex flex-col gap-1">
            <div className={rowCls(ctx, here, `${HEAD} ${h} bg-emerald-600`)}>
              si <CondLabel cond={b.cond} />
            </div>
            <Body color="border-emerald-500">
              <Blocks blocks={b.then} start={here + 1} ctx={ctx} />
            </Body>
            {b.else && (
              <>
                <div className={rowCls(ctx, elseIdx, `${HEAD} ${h} bg-emerald-700`)}>si no</div>
                <Body color="border-emerald-600">
                  <Blocks blocks={b.else} start={elseIdx + 1} ctx={ctx} />
                </Body>
              </>
            )}
          </div>,
        );
        idx += 1 + rowsIn(b.then) + (b.else ? 1 + rowsIn(b.else) : 0);
        break;
      }
      case "call":
        out.push(
          <div key={k} className={rowCls(ctx, here, `${HEAD} ${h} bg-violet-500`)}>
            <span className="font-mono text-xs opacity-80">ƒ</span> {b.name}
          </div>,
        );
        idx += 1;
        break;
      case "hole":
        out.push(
          <div
            key={k}
            className={rowCls(
              ctx,
              here,
              `inline-flex ${leafSize} items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-white text-lg font-bold text-slate-500`,
            )}
          >
            ?
          </div>,
        );
        idx += 1;
        break;
    }
  });
  return <>{out}</>;
}

type Props = {
  program: Program;
  /** Filas a resaltar (índices de flattenRows). */
  highlight?: Set<number>;
  compact?: boolean;
  className?: string;
};

export function ProgramView({ program, highlight, compact, className }: Props) {
  const ctx: Ctx = { highlight, compact };
  const h = compact ? "h-7 text-[13px]" : "h-8 text-sm";
  let idx = 0;
  const defs = (program.defs ?? []).map((d) => {
    const here = idx;
    idx += 1 + rowsIn(d.body);
    return (
      <div key={d.name} className="mb-1 flex flex-col gap-1">
        <div className={rowCls(ctx, here, `${HEAD} ${h} bg-violet-700`)}>
          <span className="font-mono text-xs opacity-80">ƒ</span> definir {d.name}
        </div>
        <Body color="border-violet-500">
          <Blocks blocks={d.body} start={here + 1} ctx={ctx} />
        </Body>
      </div>
    );
  });
  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className ?? ""}`}>
      {defs}
      <Blocks blocks={program.main} start={idx} ctx={ctx} />
    </div>
  );
}

/** Vista de una pieza suelta (opción de completar). */
export function PieceView({ blocks, compact }: { blocks: Block[]; compact?: boolean }) {
  return <ProgramView program={{ main: blocks }} compact={compact} />;
}
