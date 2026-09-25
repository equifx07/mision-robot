"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "@/components/MapView";
import { ProgramView } from "@/components/ProgramView";
import type { GameMap, Program } from "@/lib/model";
import { edgeKey, simulate, type Seg } from "@/lib/sim";

type Props = {
  map: GameMap;
  program: Program;
  /** Texto a mostrar al terminar en lugar del resultado de la misión. */
  outcome?: string;
  /** Empieza a animar solo al apretar ▶ (por defecto). */
  stepMs?: number;
  onFinished?: () => void;
};

export function RobotRunner({ map, program, outcome, stepMs = 550, onFinished }: Props) {
  const result = useMemo(() => simulate(map, program), [map, program]);
  const [step, setStep] = useState<number>(-1); // -1: sin empezar; k: se hicieron k movimientos
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const totalMoves = result.steps.length - 1;
  const crashed = result.status === "crash";
  const finished = step >= totalMoves + (crashed ? 1 : 0);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= totalMoves + (crashed ? 1 : 0)) {
          setRunning(false);
          onFinished?.();
        }
        return next;
      });
    }, stepMs);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [running, step, totalMoves, crashed, stepMs, onFinished]);

  const start = () => {
    setStep(0);
    setRunning(true);
  };

  const k = Math.max(0, Math.min(step, totalMoves));
  const robotAt = result.steps[k];
  const visited = result.steps.slice(0, k + 1);
  const trail = useMemo(() => {
    const s = new Set<Seg>();
    for (let i = 1; i <= k; i++) s.add(edgeKey(result.steps[i - 1], result.steps[i]));
    return s;
  }, [k, result.steps]);
  // Se resalta el bloque que produjo el último movimiento (o el choque).
  const currentRow = step >= 1 && step - 1 < result.trace.length ? result.trace[step - 1] : undefined;
  const highlight = currentRow !== undefined && currentRow >= 0 && (running || (finished && crashed)) ? new Set([currentRow]) : undefined;

  let message: string | null = null;
  let good = false;
  if (finished) {
    if (outcome) {
      message = outcome;
      good = true;
    } else if (result.ok) {
      message = map.kind === "maze" ? "¡Llegó a la base! Misión cumplida." : "¡Dibujó la figura!";
      good = true;
    } else if (result.status === "crash") message = `Se chocó: ${result.detail}. La misión falla.`;
    else if (result.status === "off_base") message = "Terminó el programa fuera de la base. La misión falla.";
    else if (result.status === "wrong_figure") message = "Dibujó otra figura.";
    else message = result.detail;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <MapView map={map} robotAt={robotAt} visited={map.kind === "maze" ? visited : undefined} trail={map.kind === "canvas" ? (step < 0 ? new Set() : trail) : undefined} />
        {finished && crashed && (
          <div className="mt-1 text-center text-2xl" aria-hidden>
            💥
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <ProgramView program={program} highlight={highlight} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="rounded-xl bg-blue-600 px-4 py-2 text-base font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {step < 0 ? "▶ Ejecutar" : "↺ Ver de nuevo"}
          </button>
        </div>
        {message && (
          <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${good ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message}</div>
        )}
      </div>
    </div>
  );
}
