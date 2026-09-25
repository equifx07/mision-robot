"use client";

import { Fragment, useState } from "react";
import { ItemView } from "@/components/ItemView";
import type { Item } from "@/lib/model";

type Row = {
  n: number;
  item: Item;
  dim: string;
  task: string;
  chosen: number | null;
  correct: boolean | null;
  timeS: number | null;
  order?: number[];
};

const LETTERS = ["A", "B", "C", "D"];

export function AnswerReview({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/10">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {["#", "Ítem", "Dimensión", "Tarea", "Respuesta", "Resultado", "Tiempo", ""].map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const shownLetter = r.chosen !== null && r.order ? LETTERS[r.order.indexOf(r.chosen)] : null;
            const isOpen = open === r.item.id;
            return (
              <Fragment key={r.item.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{r.n}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.item.id}</td>
                  <td className="px-3 py-2">{r.dim}</td>
                  <td className="px-3 py-2">{r.task}</td>
                  <td className="px-3 py-2">{shownLetter ? `Opción ${shownLetter}` : "sin responder"}</td>
                  <td className="px-3 py-2">
                    {r.correct === null ? (
                      <span className="text-slate-400">–</span>
                    ) : r.correct ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">✓ correcta</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">✗ incorrecta</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.timeS !== null ? `${r.timeS.toFixed(0)} s` : "–"}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => setOpen(isOpen ? null : r.item.id)} className="text-xs text-blue-700 hover:underline">
                      {isOpen ? "ocultar" : "ver ítem"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={8} className="bg-slate-50 p-4">
                      <p className="mb-2 text-xs text-slate-500">Las opciones se muestran en el orden que vio el estudiante. Su elección aparece marcada en azul; la correcta, con borde verde.</p>
                      <ItemView item={r.item} index={r.n - 1} total={rows.length} selected={r.chosen} order={r.order} review />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
