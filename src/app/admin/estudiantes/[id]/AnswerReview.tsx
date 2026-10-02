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
  typicalS: number | null;
  rushed: boolean;
  order?: number[];
};

const LETTERS = ["A", "B", "C", "D"];

export function AnswerReview({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E5E1D8] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#FAF8F4] text-left text-xs font-bold uppercase tracking-[0.06em] text-[#6B665E]">
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
                <tr className="border-t border-[#F0EDE6]">
                  <td className="px-3 py-2 tabular-nums text-[#6B665E]">{r.n}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.item.id}</td>
                  <td className="px-3 py-2">{r.dim}</td>
                  <td className="px-3 py-2">{r.task}</td>
                  <td className="px-3 py-2">{shownLetter ? `Opción ${shownLetter}` : "sin responder"}</td>
                  <td className="px-3 py-2">
                    {r.correct === null ? (
                      <span className="text-[#8F897F]">–</span>
                    ) : r.correct ? (
                      <span className="rounded-full bg-[#D5EFE5] px-2 py-0.5 text-xs font-bold text-[#146B50]">✓ correcta</span>
                    ) : (
                      <span className="rounded-full bg-[#FADBD6] px-2 py-0.5 text-xs font-bold text-[#9B2019]">✗ incorrecta</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {r.timeS !== null ? `${r.timeS.toFixed(0)} s` : "–"}
                      {r.rushed && (
                        <span className="rounded-full bg-[#FDE4CC] px-2 py-0.5 text-xs font-bold text-[#8A430C]" title="Contestó en menos de la décima parte del tiempo típico: no alcanza para leerla">
                          apurada
                        </span>
                      )}
                    </span>
                    {r.typicalS !== null && <span className="block text-xs text-[#8F897F]">típico {r.typicalS.toFixed(0)} s</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => setOpen(isOpen ? null : r.item.id)} className="text-xs font-semibold text-[#22211F] underline underline-offset-2">
                      {isOpen ? "ocultar" : "ver ítem"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={8} className="bg-[#FAF8F4] p-4">
                      <p className="mb-2 text-xs text-[#6B665E]">Las opciones se muestran en el orden que vio el estudiante. Su elección aparece marcada en azul; la correcta, con borde verde.</p>
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
