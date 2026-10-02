"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { MapView } from "@/components/MapView";
import { blockNumbers, CondChip, diffRows, measureCondChip, measureProgram, PieceView, ProgramView, type BlockSize } from "@/components/ProgramView";
import { Figure, OptionFigure } from "@/components/b/Figures";
import type { Fail } from "@/lib/art";
import { blocksLabel, fixRows } from "@/lib/fixes";
import type { Block, Item, ItemA, ItemB, OptionA, Program, TaskA } from "@/lib/model";
import { effectiveProgram, fillHole, simulate, simulateOption, type SimResult } from "@/lib/sim";

const LETTERS = ["A", "B", "C", "D"];

const CONCEPT_LABEL: Record<ItemA["concept"], string> = {
  secuencias: "Secuencias",
  repetir: "Repetir N veces",
  hasta: "Repetir hasta / mientras",
  anidados: "Bucles anidados",
  si: "Si (condicional)",
  "si-sino": "Si / si no",
  funciones: "Funciones",
};
const TASK_LABEL: Record<TaskA, string> = {
  S: "secuenciar",
  C: "completar",
  D: "depurar",
  E: "evaluar equivalencia",
};

// Tarjetas y opciones con los colores del mundo "Encastre"
const CARD = "rounded-2xl bg-white shadow-sm ring-2 ring-[#EDE3CC]";
const OPT_BASE = "rounded-2xl border-2 bg-white text-left shadow-sm transition";
const OPT_SEL = "border-[#176CE0] bg-[#EEF4FF] ring-2 ring-[#BFD6FA]";
const OPT_IDLE = "border-[#EDE3CC] hover:border-[#8DB7F5]";
const SIZE: BlockSize = "compact";

/** Alto que se reserva para encabezado, consigna y barra de confirmar al agrandar el mapa (Chromebook: 657 px útiles). */
const MAP_RESERVE = 238;
/** Alto disponible para las opciones en una Chromebook (1366 × 657 útiles). */
const OPTIONS_H = 488;
const OPT_PAD_H = 20;
const OPT_GAP = 10;

// ───────── Etiqueta del tipo de misión ─────────

const TASK_STYLE: Record<TaskA, { label: string; bg: string; fg: string; icon: ReactNode }> = {
  S: {
    label: "Elegir",
    bg: "#E4EEFD",
    fg: "#0D55BF",
    icon: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" fillRule="evenodd" />,
  },
  C: {
    label: "Completar",
    bg: "#FFF1BF",
    fg: "#805B00",
    icon: <path d="M9 3h4v2.2a2 2 0 1 0 3.8 0V3H21v7h-2.2a2 2 0 1 0 0 3.8H21V21h-7v-2.2a2 2 0 1 0-3.8 0V21H3v-7h2.2a2 2 0 1 0 0-3.8H3V3h6Z" />,
  },
  D: {
    label: "Arreglar",
    bg: "#FDE3E1",
    fg: "#B42318",
    icon: <path d="M20.6 6.3a5.5 5.5 0 0 1-7.2 6.9L6.6 20a2 2 0 0 1-2.8-2.8l6.8-6.8a5.5 5.5 0 0 1 6.9-7.2l-3.3 3.3.9 2.9 2.9.9 3.5-4Z" />,
  },
  E: {
    label: "Comparar",
    bg: "#F8E1EE",
    fg: "#96205D",
    icon: <path d="M4 8.5h16v3H4zM4 13.5h16v3H4z" />,
  },
};

export function TaskPill({ task }: { task: TaskA }) {
  const t = TASK_STYLE[task];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide" style={{ background: t.bg, color: t.fg }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {t.icon}
      </svg>
      {t.label}
    </span>
  );
}

// ───────── Ayudas ─────────

/** Texto que acompaña al hueco de condición del programa dado ("si hay" o "mientras haya"). */
function holeWord(program: Program | undefined): string {
  let word = "si hay";
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.t === "while") {
        if (b.cond.kind === "hole") word = "mientras haya";
        walk(b.body);
      } else if (b.t === "repeat" || b.t === "until") walk(b.body);
      else if (b.t === "if") {
        walk(b.then);
        if (b.else) walk(b.else);
      }
    }
  };
  if (program) {
    walk(program.main);
    for (const d of program.defs ?? []) walk(d.body);
  }
  return word;
}

/** Recorrido del programa con error (misiones de arreglar en laberinto). */
function failOf(item: ItemA): { fail?: Fail; trail?: SimResult["trail"] } {
  if (item.task !== "D" || !item.given) return {};
  const r = simulate(item.map, item.given);
  if (item.map.kind === "canvas") return { trail: r.trail };
  return { fail: { steps: r.steps, crash: r.crashAt ? { from: r.crashAt.from, dir: r.crashAt.dir } : undefined } };
}

/** Programa que se muestra en el panel "Programa" según la opción elegida, y qué filas brillan. */
function preview(item: ItemA, opt: OptionA | null): { program: Program; picked?: Set<number> } | null {
  const given = item.given;
  if (!given) return null;
  if (!opt || opt.kind === "program") return { program: given };
  const shown = opt.kind === "fix" ? effectiveProgram(item, opt) : fillHole(given, opt);
  return { program: shown, picked: diffRows(given, shown) };
}

function panelLabel(item: ItemA, chosen: boolean): string {
  if (item.givenNote) return item.givenNote;
  if (item.task === "C") return chosen ? "Así queda con tu pieza" : "Programa con un hueco";
  if (item.task === "D") return chosen ? "Así queda con tu cambio" : "Programa con un error";
  return "Programa";
}

function ArrowRight() {
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden className="shrink-0">
      <path d="M2 11h22M16 3l8 8-8 8" fill="none" stroke="#5B6477" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FixOpt = Extract<OptionA, { kind: "fix" }>;

/** Números de los bloques del programa dado que cambia una opción de arreglar. */
function fixNumbers(item: ItemA, opt: FixOpt): number[] {
  if (!item.given) return [];
  const rows = fixRows(item.given, opt.from);
  if (!rows) return [];
  const nums = blockNumbers(item.given);
  return [...new Set(rows.map((r) => nums.get(r)).filter((n): n is number => n !== undefined))].sort((a, b) => a - b);
}

function NumBadge({ n, hot }: { n: number; hot?: boolean }) {
  return (
    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${hot ? "bg-[#F2B200] text-[#3A2600]" : "bg-[#E9EDF3] text-[#4A5568]"}`}>{n}</span>
  );
}

/**
 * Opción de arreglar: "en el bloque 2: cambiar [esto] por [esto]". La etiqueta del bloque va arriba si
 * hay alto de sobra (piezas chicas) y a la izquierda si no (así las 4 opciones entran una debajo de otra).
 */
function FixContent({ item, opt, size, labelTop }: { item: ItemA; opt: FixOpt; size: BlockSize; labelTop?: boolean }) {
  const nums = fixNumbers(item, opt);
  if (labelTop)
    return (
      <div className="flex flex-col gap-1.5" aria-label={`${blocksLabel(nums)}: cambiar por`}>
        {nums.length > 0 && (
          <span className="flex items-center gap-1 text-[13px] font-semibold text-[#5B6477]">
            {nums.length === 1 ? "En el bloque" : "En los bloques"}
            {nums.map((n) => (
              <NumBadge key={n} n={n} />
            ))}
          </span>
        )}
        <div className="flex items-center gap-2">
          <PieceView blocks={opt.from} size={size} />
          <ArrowRight />
          <PieceView blocks={opt.to} size={size} />
        </div>
      </div>
    );
  return (
    <div className="flex items-center gap-2" aria-label={`${blocksLabel(nums)}: cambiar por`}>
      {nums.length > 0 && (
        <span className="flex w-[62px] shrink-0 flex-col items-center gap-1 text-[12px] font-semibold text-[#5B6477]">
          {nums.length === 1 ? "bloque" : "bloques"}
          <span className="flex flex-wrap justify-center gap-0.5">
            {nums.map((n) => (
              <NumBadge key={n} n={n} />
            ))}
          </span>
        </span>
      )}
      <PieceView blocks={opt.from} size={size} />
      <ArrowRight />
      <PieceView blocks={opt.to} size={size} />
    </div>
  );
}

function OptionContent({ item, opt, size, labelTop }: { item: ItemA; opt: OptionA; size: BlockSize; labelTop?: boolean }) {
  switch (opt.kind) {
    case "program":
      return <ProgramView program={opt.program} size={size} />;
    case "piece":
      return <PieceView blocks={opt.blocks} size={size} />;
    case "cond":
      return <CondChip cond={opt.cond} word={holeWord(item.given)} size={size} />;
    case "def":
      return <ProgramView program={{ defs: [{ name: opt.name, body: opt.body }], main: [] }} size={size} />;
    case "fix":
      return <FixContent item={item} opt={opt} size={size} labelTop={labelTop} />;
  }
}

function optionSize(item: ItemA, opt: OptionA, labelTop = false): { w: number; h: number } {
  switch (opt.kind) {
    case "program":
      return measureProgram(opt.program, SIZE);
    case "piece":
      return measureProgram({ main: opt.blocks }, SIZE);
    case "cond":
      return measureCondChip(opt.cond, holeWord(item.given), SIZE);
    case "def":
      return measureProgram({ defs: [{ name: opt.name, body: opt.body }], main: [] }, SIZE);
    case "fix": {
      const a = measureProgram({ main: opt.from }, SIZE);
      const b = measureProgram({ main: opt.to }, SIZE);
      return labelTop ? { w: Math.max(a.w + b.w + 46, 150), h: Math.max(a.h, b.h) + 30 } : { w: a.w + b.w + 46 + 70, h: Math.max(a.h, b.h) };
    }
  }
}

/** Opciones angostas: las 4 en fila entran sin quitarle mucho lugar al mapa. */
const NARROW_OPTION = 190;

/**
 * Columnas de opciones: una lista si entran las 4 una debajo de otra; si son angostas (programas
 * de flechas, que ahora van una debajo de la otra), las 4 en fila; si no, 2 × 2; si igual no entran, 4 en fila.
 */
function optionColumns(item: ItemA, availH = OPTIONS_H, labelTop = false, narrowSpace = false): { cols: 1 | 2 | 4; w: number } {
  const sizes = item.options.map((o) => optionSize(item, o, labelTop));
  const hs = sizes.map((s) => s.h + OPT_PAD_H);
  const w = Math.max(...sizes.map((s) => s.w)) + 30;
  if (hs.reduce((a, b) => a + b, 0) + 3 * OPT_GAP <= availH) return { cols: 1, w };
  // En la ventana de práctica (más angosta) conviene 2 × 2 antes que las 4 en fila.
  if (narrowSpace && 2 * Math.max(...hs) + OPT_GAP <= availH) return { cols: 2, w };
  if (w <= NARROW_OPTION) return { cols: 4, w };
  if (2 * Math.max(...hs) + OPT_GAP <= availH) return { cols: 2, w };
  return { cols: 4, w };
}

/** Alto que ocupa el título del recuadro de piezas (completar). */
const PICKER_HEAD_H = 52;

/** Arreglar: tres pasos cortos para saber qué hacer. */
function FixSteps({ canvas }: { canvas: boolean }) {
  const steps = [
    { n: 1, bg: "#E0322B", fg: "#FFFFFF", text: canvas ? "Compará las dos figuras" : "Mirá dónde se choca" },
    { n: 2, bg: "#F2B200", fg: "#3A2600", text: "Buscá el bloque que está mal" },
    { n: 3, bg: "#176CE0", fg: "#FFFFFF", text: "Elegí el cambio que lo arregla" },
  ];
  return (
    <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Cómo resolverla">
      {steps.map((st) => (
        <li key={st.n} className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-[#EDE3CC] bg-white py-0.5 pl-0.5 pr-3 text-[14px] font-semibold text-[#1F2B45]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold" style={{ background: st.bg, color: st.fg }}>
            {st.n}
          </span>
          {st.text}
        </li>
      ))}
    </ol>
  );
}

/** Arreglar, con un cambio elegido: qué bloque cambió y cómo era antes. */
function FixSummary({ item, opt }: { item: ItemA; opt: FixOpt }) {
  const nums = fixNumbers(item, opt);
  const label = blocksLabel(nums);
  return (
    <div className="mt-1.5 flex flex-col gap-1 rounded-xl bg-[#FFF6D6] px-3 py-2 text-[13px] font-semibold leading-snug text-[#6B4F00]" style={{ width: 0, minWidth: "100%", boxSizing: "border-box" }}>
      <span>{label ? `Cambiaste ${nums.length === 1 ? "el" : "los"} ${label}. Antes era:` : "Antes era:"}</span>
      <div className="relative self-start opacity-50" style={{ zoom: 0.8 }}>
        <PieceView blocks={opt.from} size={SIZE} />
        <span aria-hidden className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 -rotate-6 rounded bg-[#E0322B]" />
      </div>
    </div>
  );
}

function ReviewBadge({ r }: { r: SimResult }) {
  return (
    <div className={`mt-2 rounded-md px-2 py-1 text-xs font-medium ${r.ok ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
      {r.ok ? "✓ correcta · " : "✗ "}
      {r.detail}
    </div>
  );
}

function Letter({ pos, selected, corner }: { pos: number; selected: boolean; corner?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-sm font-bold ${corner ? "absolute -left-2.5 -top-2.5 z-10 h-7 w-7 shadow-sm ring-2 ring-white" : "h-7 w-7"} ${selected ? "bg-[#176CE0] text-white" : "bg-[#F3EDE0] text-[#1F2B45]"}`}
    >
      {LETTERS[pos]}
    </span>
  );
}

// ───────── Paneles ─────────

function MapPanel({ item, review, showCoords, mapReserve = MAP_RESERVE }: { item: ItemA; review?: boolean; showCoords?: boolean; mapReserve?: number }) {
  const { fail, trail } = failOf(item);
  const visited = review ? simulateOption(item, item.options[item.correct]).steps : undefined;
  const fit = { maxScale: item.map.kind === "canvas" ? 2.4 : 1.7, reserve: mapReserve + (fail || item.map.kind === "canvas" ? 26 : 0) };

  if (item.map.kind === "canvas" && trail) {
    // Arreglar en lienzo: la figura que tiene que dibujar y la que dibuja ahora, lado a lado.
    return (
      <div className={`${CARD} flex min-w-[300px] flex-1 flex-wrap items-start justify-center gap-3 p-2.5`}>
        <figure className="flex min-w-[180px] flex-1 flex-col items-center gap-1">
          <figcaption className="text-sm font-semibold text-[#1F2B45]">Tiene que dibujar</figcaption>
          <MapView map={item.map} fit={fit} showCoords={showCoords} />
        </figure>
        <figure className="flex min-w-[180px] flex-1 flex-col items-center gap-1">
          <figcaption className="text-sm font-semibold text-[#B42318]">Pero dibuja</figcaption>
          <MapView map={item.map} trail={trail} color="#D6246E" fit={fit} />
        </figure>
      </div>
    );
  }
  return (
    <div className={`${CARD} flex min-w-[280px] shrink flex-col items-center gap-1.5 p-2.5`}>
      <MapView map={item.map} fail={fail} visited={visited} fit={fit} showCoords={showCoords} />
      {fail && (
        <div className="flex items-center gap-2 text-sm font-semibold text-[#B42318]">
          <svg width="44" height="14" viewBox="0 0 44 14" aria-hidden>
            <path d="M2 7h26" stroke="#E0322B" strokeWidth="4" strokeDasharray="6 5" strokeLinecap="round" />
            <circle cx="36" cy="7" r="6.5" fill="#E0322B" />
            <path d="M33.3 4.3l5.4 5.4M38.7 4.3l-5.4 5.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Así se mueve con el error: se choca en la cruz.
        </div>
      )}
      {item.map.kind === "canvas" && !trail && (
        <div className="flex items-center gap-2 text-sm font-semibold text-[#5B6477]">
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22A94F] shadow" aria-hidden />
          empieza en el punto verde · cada flecha pinta un lado de un cuadradito
        </div>
      )}
    </div>
  );
}

function ProgramPanel({ item, selected, panelRef }: { item: ItemA; selected: number | null; panelRef?: Ref<HTMLDivElement> }) {
  const opt = selected === null ? null : item.options[selected];
  const p = preview(item, opt);
  if (!p) return null;
  const chosen = !!p.picked && p.picked.size > 0;
  const fix = item.task === "D";
  return (
    <div ref={panelRef} className={`${CARD} shrink-0 self-start px-3 pb-2.5 pt-2.5 ${chosen ? "ring-[#F5C542]" : ""}`}>
      {/* El título no ensancha el panel: se acomoda al ancho del programa. */}
      <div className="mb-2 text-xs font-bold uppercase leading-snug tracking-wide text-[#5B6477]" style={{ width: 0, minWidth: "100%" }}>
        {panelLabel(item, chosen)}
      </div>
      {/* La clave cambia con la opción: así la pieza nueva vuelve a encastrar con su animación. */}
      <ProgramView key={selected ?? "nada"} program={p.program} picked={p.picked} numbered={fix} hot={fix ? p.picked : undefined} size={SIZE} />
      {fix &&
        (chosen && opt?.kind === "fix" ? (
          <FixSummary item={item} opt={opt} />
        ) : (
          <p className="m-0 mt-1.5 rounded-lg bg-[#FDE3E1] px-2.5 py-1.5 text-[13px] font-semibold leading-snug text-[#B42318]" style={{ width: 0, minWidth: "100%", boxSizing: "border-box" }}>
            El programa tiene un solo error.
          </p>
        ))}
    </div>
  );
}

/** Completar: flecha que une el recuadro de piezas con el hueco (o con la pieza ya encastrada). */
function useHoleLink(rowRef: RefObject<HTMLDivElement | null>, panelRef: RefObject<HTMLDivElement | null>, boxRef: RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const [d, setD] = useState<{ line: string; head: string } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      const panel = panelRef.current;
      const box = boxRef.current;
      const target = panel?.querySelector("[data-hole]") ?? panel?.querySelector("[data-picked]");
      if (!row || !box || !target) return setD(null);
      const r = row.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const x1 = t.right - r.left + 6;
      const y1 = t.top + t.height / 2 - r.top;
      const x2 = b.left - r.left - 2;
      if (x2 < x1 + 28) return setD(null); // las piezas quedaron abajo (pantalla angosta): sin flecha
      const y2 = Math.min(Math.max(y1, b.top - r.top + 26), b.bottom - r.top - 26);
      const mid = Math.max(x1 + 14, x2 - 20);
      setD({ line: `M ${x2} ${y2} H ${mid} V ${y1} H ${x1 + 4}`, head: `M ${x1 + 14} ${y1 - 8} L ${x1 + 4} ${y1} L ${x1 + 14} ${y1 + 8}` });
    };
    measure();
    const late = window.setTimeout(measure, 400); // después de la animación de encastre
    const ro = new ResizeObserver(measure);
    for (const el of [rowRef.current, panelRef.current, boxRef.current]) if (el) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(late);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return d;
}

// ───────── Ítem ─────────

type Props = {
  item: Item;
  index: number;
  total: number;
  selected: number | null;
  onSelect?: (optionIndex: number) => void;
  /** Orden de presentación de las opciones (permutación de índices). */
  order?: number[];
  /** Modo revisión: muestra la respuesta correcta, el recorrido y el resultado de cada opción. */
  review?: boolean;
  showCoords?: boolean;
  /** Alto que se reserva para lo que rodea al mapa (dentro de la ventana de práctica hay menos lugar). */
  mapReserve?: number;
};

export function ItemView(props: Props) {
  return props.item.part === "A" ? <ItemAView {...props} item={props.item} /> : <ItemBView {...props} item={props.item} />;
}

function ReviewHeader({ item, index, total }: { item: Item; index: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm font-semibold uppercase tracking-wide text-[#5B6477]">
        Misión {index + 1} de {total}
      </div>
      <div className="flex flex-wrap gap-1 text-xs">
        <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-white">{item.id}</span>
        {item.part === "A" ? (
          <>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">{CONCEPT_LABEL[item.concept]}</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">{TASK_LABEL[item.task]}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{item.map.kind === "maze" ? "laberinto" : "lienzo"}</span>
          </>
        ) : (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-800">{item.practice}</span>
        )}
      </div>
    </div>
  );
}

function ItemAView({ item, index, total, selected, onSelect, order, review, showCoords, mapReserve = MAP_RESERVE }: Props & { item: ItemA }) {
  const displayOrder = order ?? item.options.map((_, i) => i);
  const results = review ? item.options.map((o) => simulateOption(item, o)) : null;
  const picker = item.task === "C" && !!item.given;
  const fix = item.task === "D";
  // Dentro de la ventana de práctica hay menos alto: se descuenta lo que se reserva de más para el mapa.
  const availH = OPTIONS_H - Math.max(0, mapReserve - MAP_RESERVE) - (picker ? PICKER_HEAD_H : 0);
  const narrowSpace = mapReserve > MAP_RESERVE;
  const labelTop = fix && optionColumns(item, availH, true, narrowSpace).cols === 1;
  const { cols, w } = optionColumns(item, availH, labelTop, narrowSpace);
  const gridCols = cols;
  const rowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const link = useHoleLink(rowRef, panelRef, boxRef, [item.id, selected, picker]);
  const pickerTitle = item.options.every((o) => o.kind === "cond") ? "¿Cuál de estas condiciones va en el hueco?" : "¿Cuál de estas piezas va en el hueco?";

  return (
    <section className="flex flex-col gap-3">
      {review && <ReviewHeader item={item} index={index} total={total} />}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <TaskPill task={item.task} />
        <p className="text-xl font-semibold leading-snug text-[#1F2B45]">{item.prompt}</p>
        {fix && (
          <div className="ml-auto">
            <FixSteps canvas={item.map.kind === "canvas"} />
          </div>
        )}
      </div>
      <div ref={rowRef} className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center-safe">
        <MapPanel item={item} review={review} showCoords={showCoords} mapReserve={mapReserve} />
        <ProgramPanel item={item} selected={review ? null : selected} panelRef={panelRef} />
        {picker && link && (
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" aria-hidden>
            <path d={link.line} fill="none" stroke="#F2B200" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <path d={link.head} fill="none" stroke="#F2B200" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <div ref={boxRef} className={picker ? "shrink-0 rounded-2xl border-[3px] border-[#F5D06A] bg-[#FFFBEA] px-3 pb-3 pt-2.5 lg:ml-6" : "contents"}>
          {picker && (
            <div className="mb-3 text-[15px] font-bold leading-snug text-[#6B4F00]" style={{ width: 0, minWidth: "100%" }}>
              {pickerTitle}
            </div>
          )}
        <div
          className="grid shrink-0 gap-x-3 gap-y-2.5"
          style={{ gridTemplateColumns: gridCols === 1 ? `minmax(0, ${Math.max(w, 150)}px)` : `repeat(${gridCols}, minmax(86px, max-content))` }}
        >
          {displayOrder.map((optIdx, pos) => {
            const opt = item.options[optIdx];
            const isSel = selected === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={onSelect ? () => onSelect(optIdx) : undefined}
                aria-pressed={isSel}
                aria-label={`Opción ${LETTERS[pos]}`}
                className={`relative flex flex-col items-start px-3 pb-1 pt-3 ${OPT_BASE} ${isSel ? OPT_SEL : OPT_IDLE} ${review && optIdx === item.correct ? "border-green-500" : ""}`}
              >
                <Letter pos={pos} selected={isSel} corner />
                <OptionContent item={item} opt={opt} size={SIZE} labelTop={labelTop} />
                {results && <ReviewBadge r={results[optIdx]} />}
              </button>
            );
          })}
        </div>
        </div>
      </div>
      {review && item.notes && <p className="text-sm text-slate-500">Nota: {item.notes}</p>}
    </section>
  );
}

function ItemBView({ item, index, total, selected, onSelect, order, review }: Props & { item: ItemB }) {
  const displayOrder = order ?? item.options.map((_, i) => i);
  const visual = !!item.optionFigure;
  return (
    <section className="flex flex-col gap-4">
      {review && <ReviewHeader item={item} index={index} total={total} />}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {item.facts && (
            <ul className="flex flex-col gap-1.5">
              {item.facts.map((f, i) => (
                <li key={i} className="flex gap-2 text-lg leading-snug text-[#1F2B45]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FEA814]" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          <div className={`${CARD} p-3`}>
            <Figure id={item.figure} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 lg:w-[520px]">
          <p className="text-xl font-bold leading-snug text-[#1F2B45]">{item.prompt}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayOrder.map((optIdx, pos) => {
              const isSel = selected === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={onSelect ? () => onSelect(optIdx) : undefined}
                  aria-pressed={isSel}
                  aria-label={`Opción ${LETTERS[pos]}`}
                  className={`relative flex items-center gap-3 ${visual ? "justify-center px-3 pb-2.5 pt-4" : "p-3"} ${OPT_BASE} ${isSel ? OPT_SEL : OPT_IDLE} ${review && optIdx === item.correct ? "border-green-500" : ""}`}
                >
                  <Letter pos={pos} selected={isSel} corner={visual} />
                  {visual ? (
                    <OptionFigure id={item.optionFigure!} index={optIdx} />
                  ) : (
                    <span className="text-lg font-medium leading-snug text-[#1F2B45]">{item.options[optIdx]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {review && item.notes && <p className="text-sm text-slate-500">Nota: {item.notes}</p>}
    </section>
  );
}
