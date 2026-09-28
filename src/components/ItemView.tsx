"use client";

import type { ReactNode } from "react";
import { MapView } from "@/components/MapView";
import { CondChip, diffRows, measureCondChip, measureProgram, PieceView, ProgramView, type BlockSize } from "@/components/ProgramView";
import { Figure, OptionFigure } from "@/components/b/Figures";
import type { Fail } from "@/lib/art";
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

/** Opción de arreglar: "cambiar [esto] por [esto]". */
function FixContent({ opt, size }: { opt: Extract<OptionA, { kind: "fix" }>; size: BlockSize }) {
  return (
    <div className="flex items-center gap-2" aria-label="cambiar por">
      <PieceView blocks={opt.from} size={size} />
      <ArrowRight />
      <PieceView blocks={opt.to} size={size} />
    </div>
  );
}

function OptionContent({ item, opt, size }: { item: ItemA; opt: OptionA; size: BlockSize }) {
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
      return <FixContent opt={opt} size={size} />;
  }
}

function optionSize(item: ItemA, opt: OptionA): { w: number; h: number } {
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
      return { w: a.w + b.w + 46, h: Math.max(a.h, b.h) };
    }
  }
}

/** Columnas de opciones: una lista si entran las 4 una debajo de otra; si no, 2 × 2; si igual no entran, 4 en fila. */
function optionColumns(item: ItemA): { cols: 1 | 2 | 4; w: number } {
  const sizes = item.options.map((o) => optionSize(item, o));
  const hs = sizes.map((s) => s.h + OPT_PAD_H);
  const w = Math.max(...sizes.map((s) => s.w)) + 30;
  if (hs.reduce((a, b) => a + b, 0) + 3 * OPT_GAP <= OPTIONS_H) return { cols: 1, w };
  if (2 * Math.max(...hs) + OPT_GAP <= OPTIONS_H) return { cols: 2, w };
  return { cols: 4, w };
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

function MapPanel({ item, review, showCoords }: { item: ItemA; review?: boolean; showCoords?: boolean }) {
  const { fail, trail } = failOf(item);
  const visited = review ? simulateOption(item, item.options[item.correct]).steps : undefined;
  const fit = { maxScale: item.map.kind === "canvas" ? 2.4 : 1.7, reserve: MAP_RESERVE + (fail || item.map.kind === "canvas" ? 26 : 0) };

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

function ProgramPanel({ item, selected }: { item: ItemA; selected: number | null }) {
  const opt = selected === null ? null : item.options[selected];
  const p = preview(item, opt);
  if (!p) return null;
  const chosen = !!p.picked && p.picked.size > 0;
  return (
    <div className={`${CARD} shrink-0 self-start px-3 pb-2 pt-2.5 ${chosen ? "ring-[#F5C542]" : ""}`}>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5B6477]">{panelLabel(item, chosen)}</div>
      <ProgramView program={p.program} picked={p.picked} size={SIZE} />
    </div>
  );
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

function ItemAView({ item, index, total, selected, onSelect, order, review, showCoords }: Props & { item: ItemA }) {
  const displayOrder = order ?? item.options.map((_, i) => i);
  const results = review ? item.options.map((o) => simulateOption(item, o)) : null;
  const { cols, w } = optionColumns(item);
  const gridCols = cols;

  return (
    <section className="flex flex-col gap-3">
      {review && <ReviewHeader item={item} index={index} total={total} />}
      <div className="flex items-center gap-3">
        <TaskPill task={item.task} />
        <p className="text-xl font-semibold leading-snug text-[#1F2B45]">{item.prompt}</p>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
        <MapPanel item={item} review={review} showCoords={showCoords} />
        <ProgramPanel item={item} selected={review ? null : selected} />
        <div
          className="grid shrink-0 gap-x-3 gap-y-2.5"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, ${Math.max(w, 150)}px))` }}
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
                <OptionContent item={item} opt={opt} size={SIZE} />
                {results && <ReviewBadge r={results[optIdx]} />}
              </button>
            );
          })}
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
