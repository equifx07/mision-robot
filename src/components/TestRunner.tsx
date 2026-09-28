"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ItemView } from "@/components/ItemView";
import { Robot } from "@/components/MapView";
import { IntroStepContent, PracticeContent } from "@/components/Tutorial";
import { ATTEMPT_KEY } from "@/components/StartForm";
import { ITEMS } from "@/lib/items";
import { INTRO, PRACTICES } from "@/lib/tutorial";

const TIME_LIMIT_MS = 45 * 60 * 1000;

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "intro"; step: number }
  | { kind: "practice"; itemIndex: number }
  | { kind: "item"; itemIndex: number }
  | { kind: "finishing" }
  | { kind: "done"; status: string };

type AttemptState = { studentName: string; startedAt: string; optionOrders: Record<string, number[]> };

export function TestRunner({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(TIME_LIMIT_MS);
  const shownPerf = useRef<number>(0);
  const shownAt = useRef<string>("");
  const finishing = useRef(false);

  const finish = useCallback(
    async (why: "done" | "timeout") => {
      if (finishing.current) return;
      finishing.current = true;
      setPhase({ kind: "finishing" });
      try {
        const res = await fetch(`/api/attempts/${attemptId}/finish`, { method: "POST" });
        const data = await res.json();
        setPhase({ kind: "done", status: data.status ?? (why === "timeout" ? "timed_out" : "finished") });
      } catch {
        setPhase({ kind: "done", status: why === "timeout" ? "timed_out" : "finished" });
      }
      try {
        localStorage.removeItem(ATTEMPT_KEY);
      } catch {
        /* sin localStorage */
      }
    },
    [attemptId],
  );

  const goToItem = useCallback(
    (index: number, skipPractice = false) => {
      if (index >= ITEMS.length) {
        void finish("done");
        return;
      }
      const item = ITEMS[index];
      if (!skipPractice && PRACTICES[item.id]) {
        setPhase({ kind: "practice", itemIndex: index });
        return;
      }
      setSelected(null);
      setSaveError(null);
      shownPerf.current = performance.now();
      shownAt.current = new Date().toISOString();
      setPhase({ kind: "item", itemIndex: index });
      window.scrollTo({ top: 0 });
    },
    [finish],
  );

  // Carga inicial del intento
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/attempts/${attemptId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontramos tu prueba. Volvé a la pantalla inicial.");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setAttempt({ studentName: d.studentName, startedAt: d.startedAt, optionOrders: d.optionOrders });
        if (d.status !== "in_progress") {
          setPhase({ kind: "done", status: d.status });
          return;
        }
        const done = new Set<string>((d.answers as { itemId: string }[]).map((a) => a.itemId));
        setAnswered(done);
        if (done.size === 0) setPhase({ kind: "intro", step: 0 });
        else {
          const next = ITEMS.findIndex((it) => !done.has(it.id));
          if (next < 0) void finish("done");
          else goToItem(next);
        }
      })
      .catch((err) => {
        if (!cancelled) setPhase({ kind: "error", message: err instanceof Error ? err.message : "Error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId, finish, goToItem]);

  // Cronómetro global
  useEffect(() => {
    if (!attempt) return;
    const tick = () => {
      const left = TIME_LIMIT_MS - (Date.now() - Date.parse(attempt.startedAt));
      setRemainingMs(left);
      if (left <= 0 && (phase.kind === "item" || phase.kind === "practice" || phase.kind === "intro")) void finish("timeout");
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [attempt, phase.kind, finish]);

  // Aviso al cerrar la pestaña durante la prueba
  useEffect(() => {
    if (phase.kind !== "item") return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase.kind]);

  async function confirm() {
    if (phase.kind !== "item" || selected === null || saving) return;
    const item = ITEMS[phase.itemIndex];
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          chosen: selected,
          timeMs: Math.round(performance.now() - shownPerf.current),
          shownAt: shownAt.current,
        }),
      });
      if (res.status === 409) {
        const d = await res.json();
        setPhase({ kind: "done", status: d.status ?? "finished" });
        return;
      }
      if (!res.ok) throw new Error("No se pudo guardar la respuesta.");
      setAnswered((s) => new Set(s).add(item.id));
      goToItem(phase.itemIndex + 1);
    } catch {
      setSaveError("No se pudo guardar. Revisá la conexión y apretá Confirmar de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const minutes = Math.max(0, Math.ceil(remainingMs / 60000));
  const total = ITEMS.length;

  const header = (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-2 font-black text-slate-800">
          <svg width="34" height="34" viewBox="-26 -30 52 56" aria-hidden>
            <Robot x={0} y={0} scale={0.95} />
          </svg>
          Misión Robot
        </div>
        {phase.kind === "item" && (
          <div className="flex flex-1 items-center gap-3">
            <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
              Misión {phase.itemIndex + 1} de {total}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#176CE0] transition-all" style={{ width: `${(phase.itemIndex / total) * 100}%` }} />
            </div>
          </div>
        )}
        {attempt && phase.kind !== "done" && phase.kind !== "loading" && (
          <div className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${minutes <= 5 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`} title="Tiempo restante">
            ⏱ {minutes} min
          </div>
        )}
      </div>
    </header>
  );

  let body: React.ReactNode = null;

  if (phase.kind === "loading") body = <p className="p-10 text-center text-slate-500">Cargando…</p>;
  else if (phase.kind === "error")
    body = (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-red-700">{phase.message}</p>
        <a href="/" className="mt-4 inline-block rounded-xl bg-[#176CE0] shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] px-4 py-2 font-semibold text-white">
          Ir al inicio
        </a>
      </div>
    );
  else if (phase.kind === "intro") {
    const step = INTRO[phase.step];
    const last = phase.step === INTRO.length - 1;
    body = (
      <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Explicación · {phase.step + 1} de {INTRO.length}
        </div>
        <IntroStepContent step={step} stepKey={String(phase.step)} />
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={phase.step === 0}
            onClick={() => setPhase({ kind: "intro", step: phase.step - 1 })}
            className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={() => (last ? goToItem(0) : setPhase({ kind: "intro", step: phase.step + 1 }))}
            className="rounded-2xl bg-[#176CE0] shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] px-6 py-3 text-lg font-semibold text-white"
          >
            {last ? "Empezar" : "Siguiente →"}
          </button>
        </div>
      </div>
    );
  } else if (phase.kind === "practice") {
    const item = ITEMS[phase.itemIndex];
    const p = PRACTICES[item.id];
    body = (
      <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
        <PracticeContent practice={p} practiceKey={item.id} />
        <div className="flex justify-end">
          <button type="button" onClick={() => goToItem(phase.itemIndex, true)} className="rounded-2xl bg-[#176CE0] shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] px-6 py-3 text-lg font-semibold text-white">
            Ir a la misión {phase.itemIndex + 1} →
          </button>
        </div>
      </div>
    );
  } else if (phase.kind === "item") {
    const item = ITEMS[phase.itemIndex];
    body = (
      <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-4">
        <ItemView
          key={item.id}
          item={item}
          index={phase.itemIndex}
          total={total}
          selected={selected}
          onSelect={setSelected}
          order={attempt?.optionOrders[item.id]}
        />
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2">
            <span className="text-sm text-slate-600">{saveError ? <span className="font-semibold text-red-700">{saveError}</span> : selected === null ? "Elegí una opción." : "¿Lista tu respuesta?"}</span>
            <button
              type="button"
              onClick={confirm}
              disabled={selected === null || saving}
              className="rounded-2xl bg-[#0F8743] px-6 py-2.5 text-lg font-semibold text-white shadow-[inset_0_-4px_0_#0A6231] hover:bg-[#0D7A3C] disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    );
  } else if (phase.kind === "finishing") body = <p className="p-10 text-center text-slate-500">Guardando tu misión…</p>;
  else if (phase.kind === "done") {
    const timedOut = phase.status === "timed_out";
    body = (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center">
        <svg width="110" height="110" viewBox="-46 -48 92 92" aria-hidden>
          <Robot x={0} y={0} scale={1.55} state={phase.status === "timed_out" ? "normal" : "happy"} />
        </svg>
        <h2 className="text-3xl font-black text-slate-800">{timedOut ? "Se terminó el tiempo" : "¡Misión cumplida!"}</h2>
        <p className="text-lg text-slate-700">
          {timedOut ? "Guardamos todo lo que respondiste. " : ""}
          ¡Muchas gracias por participar{attempt ? `, ${attempt.studentName.split(" ")[0]}` : ""}!
        </p>
        <p className="text-slate-500">Ya podés cerrar esta ventana y avisarle a tu docente que terminaste.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      {body}
    </div>
  );
}
