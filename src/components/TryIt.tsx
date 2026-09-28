"use client";

// Misión de práctica: mismo formato que la prueba, pero con un botón "Probar" que hace
// correr al robot con la opción elegida. No cuenta para el resultado.

import { useState } from "react";
import { ItemView } from "@/components/ItemView";
import { RobotRunner } from "@/components/RobotRunner";
import type { ItemA } from "@/lib/model";
import { effectiveProgram, simulateOption } from "@/lib/sim";

export function TryIt({ item }: { item: ItemA }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [trying, setTrying] = useState(false);
  const [runKey, setRunKey] = useState(0);

  if (trying && selected !== null) {
    const opt = item.options[selected];
    const ok = simulateOption(item, opt).ok;
    return (
      <div className="flex flex-col gap-3 rounded-3xl bg-[#FFF8E6] p-3 ring-2 ring-[#F5D78A] sm:p-4">
        <div className="text-sm font-bold uppercase tracking-wide text-[#8A6500]">Así se mueve con tu elección</div>
        <RobotRunner key={runKey} map={item.map} program={effectiveProgram(item, opt)} autoPlay />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTrying(false)}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-[#1F2B45] ring-2 ring-[#EDE3CC] hover:bg-slate-50"
          >
            ← Elegir otra opción
          </button>
          <span className={`text-base font-semibold ${ok ? "text-green-700" : "text-[#5B6477]"}`}>
            {ok ? "¡Muy bien! En la prueba vas a tener que pensarlo sin probar." : "Esa opción no funciona. Probá con otra."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-[#FFF8E6] p-3 ring-2 ring-[#F5D78A] sm:p-4">
      <div className="text-sm font-bold uppercase tracking-wide text-[#8A6500]">Probá vos</div>
      <ItemView item={item} index={0} total={1} selected={selected} onSelect={setSelected} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selected === null}
          onClick={() => {
            setRunKey((k) => k + 1);
            setTrying(true);
          }}
          className="rounded-xl bg-[#176CE0] px-5 py-2.5 text-lg font-semibold text-white shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] disabled:opacity-40"
        >
          ▶ Probar
        </button>
        <span className="text-base text-[#5B6477]">{selected === null ? "Tocá una opción." : "Apretá Probar para ver qué pasa."}</span>
      </div>
    </div>
  );
}
