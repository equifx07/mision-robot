"use client";

// Misión de práctica dentro de la ventana del tutorial: mismo formato que la prueba, pero con un
// botón "Probar" que hace correr al robot con la opción elegida. No cuenta para el resultado.

import { useState } from "react";
import { ItemView } from "@/components/ItemView";
import { RobotRunner } from "@/components/RobotRunner";
import type { ItemA } from "@/lib/model";
import { effectiveProgram, simulateOption } from "@/lib/sim";

const VIOLET = "#6B4FD8";
const VIOLET_DARK = "#3A2592";

export function TryIt({ item }: { item: ItemA }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [trying, setTrying] = useState(false);
  const [runKey, setRunKey] = useState(0);

  if (trying && selected !== null) {
    const opt = item.options[selected];
    const ok = simulateOption(item, opt).ok;
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm font-bold uppercase tracking-wide text-[#5B4B9A]">Así me muevo con tu elección</div>
        <RobotRunner key={runKey} map={item.map} program={effectiveProgram(item, opt)} autoPlay tone="guide" mapReserve={400} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTrying(false)}
            className="min-h-[44px] rounded-xl border-2 border-[#CFC2FA] bg-white px-4 font-semibold text-[#3A2592] hover:bg-[#F6F3FF]"
          >
            ← Elegir otra opción
          </button>
          <span className={`text-base font-semibold ${ok ? "text-green-700" : "text-[#5B4B9A]"}`}>
            {ok ? "¡Muy bien! En la prueba vas a tener que pensarlo sin probar." : "Esa opción no funciona. Probá con otra."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemView item={item} index={0} total={1} selected={selected} onSelect={setSelected} mapReserve={item.map.kind === "canvas" ? 420 : 390} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selected === null}
          onClick={() => {
            setRunKey((k) => k + 1);
            setTrying(true);
          }}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl px-5 text-lg font-bold text-white hover:brightness-110 disabled:opacity-40"
          style={{ background: VIOLET, boxShadow: `inset 0 -4px 0 ${VIOLET_DARK}` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l11-7z" fill="#FFFFFF" />
          </svg>
          Probar
        </button>
        <span className="text-base text-[#5B4B9A]">{selected === null ? "Tocá una opción." : "Apretá Probar para ver qué pasa."}</span>
      </div>
    </div>
  );
}
