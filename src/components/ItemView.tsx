"use client";

import { MapView } from "@/components/MapView";
import { CondLabel, diffRows, PieceView, ProgramView } from "@/components/ProgramView";
import { Figure } from "@/components/b/Figures";
import type { Item, ItemA, OptionA } from "@/lib/model";
import { effectiveProgram, simulateOption, type SimResult } from "@/lib/sim";

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
const TASK_LABEL: Record<ItemA["task"], string> = {
  S: "secuenciar",
  C: "completar",
  D: "depurar",
  E: "evaluar equivalencia",
};

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

function OptionContent({ item, opt }: { item: ItemA; opt: OptionA }) {
  switch (opt.kind) {
    case "program": {
      const highlight = item.task === "D" && item.given ? diffRows(item.given, effectiveProgram(item, opt)) : undefined;
      return <ProgramView program={opt.program} highlight={highlight} />;
    }
    case "piece":
      return <PieceView blocks={opt.blocks} />;
    case "cond":
      return (
        <div className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-sm font-semibold text-white">
          <CondLabel cond={opt.cond} />
        </div>
      );
    case "def":
      return <ProgramView program={{ defs: [{ name: opt.name, body: opt.body }], main: [] }} />;
  }
}

function ReviewBadge({ r }: { r: SimResult }) {
  return (
    <div className={`mt-2 rounded-md px-2 py-1 text-xs font-medium ${r.ok ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
      {r.ok ? "✓ correcta · " : "✗ "}
      {r.detail}
    </div>
  );
}

export function ItemView({ item, index, total, selected, onSelect, order, review, showCoords }: Props) {
  const displayOrder = order ?? item.options.map((_, i) => i);
  const isA = item.part === "A";

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Misión {index + 1} de {total}
      </div>
      {review && (
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-white">{item.id}</span>
          {isA ? (
            <>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">{CONCEPT_LABEL[item.concept]}</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">{TASK_LABEL[item.task]}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{item.map.kind === "maze" ? "laberinto" : "lienzo"}</span>
            </>
          ) : (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-800">{item.practice}</span>
          )}
        </div>
      )}
    </div>
  );

  if (isA) {
    const results = review ? item.options.map((o) => simulateOption(item, o)) : null;
    const visited = review ? simulateOption(item, item.options[item.correct]).steps : undefined;
    return (
      <section className="flex flex-col gap-4">
        {header}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col gap-4 lg:w-[440px]">
            <p className="text-lg font-bold leading-snug text-slate-800">{item.prompt}</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <MapView map={item.map} visited={visited} showCoords={showCoords} />
            </div>
            {item.given && (
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.givenNote ?? (item.task === "C" ? "Programa a completar" : "Programa")}
                </div>
                <ProgramView program={item.given} />
              </div>
            )}
          </div>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {displayOrder.map((optIdx, pos) => {
              const opt = item.options[optIdx];
              const isSel = selected === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={onSelect ? () => onSelect(optIdx) : undefined}
                  aria-pressed={isSel}
                  className={`flex flex-col items-start rounded-2xl border-2 bg-white p-3 text-left shadow-sm transition ${
                    isSel ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"
                  } ${review && optIdx === item.correct ? "border-green-500" : ""}`}
                >
                  <span
                    className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                      isSel ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {LETTERS[pos]}
                  </span>
                  <OptionContent item={item} opt={opt} />
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

  return (
    <section className="flex flex-col gap-4">
      {header}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex shrink-0 flex-col gap-4 lg:w-[480px]">
          <p className="text-lg font-bold leading-snug text-slate-800">{item.prompt}</p>
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <Figure id={item.figure} />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {displayOrder.map((optIdx, pos) => {
            const isSel = selected === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={onSelect ? () => onSelect(optIdx) : undefined}
                aria-pressed={isSel}
                className={`flex items-start gap-3 rounded-2xl border-2 bg-white p-3 text-left shadow-sm transition ${
                  isSel ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"
                } ${review && optIdx === item.correct ? "border-green-500" : ""}`}
              >
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    isSel ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {LETTERS[pos]}
                </span>
                <span className="text-base font-medium text-slate-800">{item.options[optIdx]}</span>
              </button>
            );
          })}
        </div>
      </div>
      {review && item.notes && <p className="text-sm text-slate-500">Nota: {item.notes}</p>}
    </section>
  );
}
