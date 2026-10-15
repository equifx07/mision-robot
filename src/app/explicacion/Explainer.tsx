"use client";

// Explicación para 4.º: el docente proyecta los ejercicios uno atrás del otro y los resuelve con la clase.
// Igual que en la prueba, pero al apretar "Probar" se ve el resultado: en la parte A el robot ejecuta la
// opción elegida (como en el tutorial) y en la parte B se dice si es correcta.

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemView } from "@/components/ItemView";
import { Robot } from "@/components/MapView";
import { RobotRunner } from "@/components/RobotRunner";
import { EXPLAINED } from "@/lib/explicacion";
import { effectiveProgram } from "@/lib/sim";

const LETTERS = ["A", "B", "C", "D"];

export function Explainer() {
  const router = useRouter();
  const params = useSearchParams();
  const found = EXPLAINED.findIndex((x) => x.key === params.get("e"));
  const ex = found < 0 ? 0 : found;
  return <Exercise key={EXPLAINED[ex].key} ex={ex} go={(i) => router.replace(`/explicacion?e=${EXPLAINED[i].key}`, { scroll: false })} />;
}

function Exercise({ ex, go }: { ex: number; go: (i: number) => void }) {
  const x = EXPLAINED[ex];
  const item = x.item;
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  // En la parte A, el resultado aparece cuando el robot termina de moverse.
  const [shown, setShown] = useState(false);
  const onFinished = useCallback(() => setShown(true), []);
  const [vh, setVh] = useState(768);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const lastEx = ex === EXPLAINED.length - 1;
  const ok = selected !== null && selected === item.correct;
  const check = useCallback(() => {
    if (selected === null) return;
    setShown(item.part === "B");
    setChecked(true);
    window.scrollTo({ top: 0 });
  }, [selected, item.part]);
  const retry = useCallback(() => {
    setChecked(false);
    setShown(false);
  }, []);

  // Flecha derecha / Av Pág: probar o pasar al siguiente. Flecha izquierda / Re Pág: volver.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown"].includes(e.key)) {
        e.preventDefault();
        if (!checked) check();
        else if (!lastEx) go(ex + 1);
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        if (checked) retry();
        else if (ex > 0) go(ex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checked, check, retry, go, ex, lastEx]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const result = checked && shown && selected !== null && (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-2xl font-black ${ok ? "bg-[#DCF5E6] text-[#0B6B36]" : "bg-[#FDE3E1] text-[#B42318]"}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: ok ? "#0F8743" : "#E0322B" }} aria-hidden>
        {ok ? "✓" : "✗"}
      </span>
      {ok ? `¡Correcto! La ${LETTERS[selected]} es la respuesta.` : `La ${LETTERS[selected]} no es correcta.`}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2 font-black text-slate-800">
            <svg width="34" height="34" viewBox="-26 -30 52 56" aria-hidden>
              <Robot x={0} y={0} scale={0.95} />
            </svg>
            Práctica en clase · 4.º
          </div>
          <nav aria-label="Ejercicios" className="flex flex-1 flex-wrap gap-1.5">
            {EXPLAINED.map((e, i) => (
              <button
                key={e.key}
                type="button"
                onClick={() => go(i)}
                aria-current={i === ex ? "step" : undefined}
                className={`min-h-[36px] rounded-full px-3 text-sm font-semibold ${i === ex ? "bg-[#176CE0] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {i + 1}. {e.title}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={fullscreen} className="min-h-[36px] rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100">
              ⛶ Pantalla completa
            </button>
            <a href="/admin" className="min-h-[36px] content-center rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100">
              Volver al panel
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 pb-28 pt-4">
        {checked && item.part === "A" && selected !== null ? (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#176CE0] px-3 py-1 text-sm font-bold uppercase tracking-wide text-white">Opción {LETTERS[selected]}</span>
              <span className="text-xl font-semibold text-[#1F2B45]">{item.prompt}</span>
            </div>
            {result}
            <RobotRunner map={item.map} program={effectiveProgram(item, item.options[selected])} autoPlay mapReserve={380} onFinished={onFinished} />
          </section>
        ) : (
          <>
            {result}
            <ItemView item={item} index={ex} total={EXPLAINED.length} selected={selected} onSelect={checked ? undefined : setSelected} mapReserve={x.reserve ?? 300} optionsH={Math.max(320, vh - 250)} />
          </>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5">
          {checked ? (
            <button type="button" onClick={retry} className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-white px-5 text-lg font-semibold text-slate-700 hover:bg-slate-50">
              ← Probar otra opción
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(ex - 1)}
              disabled={ex === 0}
              className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-white px-5 text-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Ejercicio anterior
            </button>
          )}
          <span className="text-base text-slate-600">
            Ejercicio {ex + 1} de {EXPLAINED.length}
            {!checked && (selected === null ? " · Elegí una opción." : " · Apretá Probar.")}
          </span>
          {checked ? (
            <button
              type="button"
              onClick={() => go(ex + 1)}
              disabled={lastEx}
              className="min-h-[52px] rounded-2xl bg-[#0F8743] px-6 text-lg font-bold text-white shadow-[inset_0_-4px_0_#0A6231] hover:bg-[#0D7A3C] disabled:opacity-40"
            >
              {lastEx ? "Último ejercicio" : "Siguiente ejercicio →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={selected === null}
              className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-[#176CE0] px-6 text-lg font-bold text-white shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5v14l11-7z" fill="#FFFFFF" />
              </svg>
              Probar
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
