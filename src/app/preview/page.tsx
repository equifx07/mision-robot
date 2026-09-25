"use client";

import { useState } from "react";
import { ItemView } from "@/components/ItemView";
import { ITEMS, ITEMS_A, ITEMS_B } from "@/lib/items";
import { simulateOption } from "@/lib/sim";

export default function PreviewPage() {
  const [coords, setCoords] = useState(false);
  const [filter, setFilter] = useState<"all" | "A" | "B">("all");
  const list = ITEMS.filter((i) => filter === "all" || i.part === filter);

  const checks = ITEMS_A.map((item) => {
    const ok = item.options.map((o) => simulateOption(item, o).ok);
    const good = ok.filter(Boolean).length === 1 && ok[item.correct];
    return { id: item.id, good };
  });
  const bad = checks.filter((c) => !c.good);

  return (
    <main className="mx-auto max-w-[1320px] p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Misión Robot · revisión del banco de ítems</h1>
          <p className="text-sm text-slate-600">
            {ITEMS_A.length} ítems Parte A + {ITEMS_B.length} ítems Parte B. Verificación automática:{" "}
            {bad.length === 0 ? (
              <span className="font-semibold text-green-700">todos los ítems tienen exactamente una opción correcta.</span>
            ) : (
              <span className="font-semibold text-red-700">revisar {bad.map((b) => b.id).join(", ")}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={coords} onChange={(e) => setCoords(e.target.checked)} /> coordenadas
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "A" | "B")} className="rounded-md border border-slate-300 bg-white px-2 py-1">
            <option value="all">Todos</option>
            <option value="A">Parte A</option>
            <option value="B">Parte B</option>
          </select>
        </div>
      </header>
      <nav className="mb-6 flex flex-wrap gap-1 text-xs">
        {ITEMS.map((i) => (
          <a key={i.id} href={`#${i.id}`} className="rounded bg-white px-2 py-1 font-mono ring-1 ring-slate-200 hover:bg-slate-100">
            {i.id}
          </a>
        ))}
      </nav>
      <div className="flex flex-col gap-8">
        {list.map((item) => (
          <article key={item.id} id={item.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-6">
            <ItemView
              item={item}
              index={ITEMS.indexOf(item)}
              total={ITEMS.length}
              selected={null}
              review
              showCoords={coords}
            />
          </article>
        ))}
      </div>
    </main>
  );
}
