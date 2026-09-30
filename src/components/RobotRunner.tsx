"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "@/components/MapView";
import { ProgramView } from "@/components/ProgramView";
import type { RobotState } from "@/lib/art";
import type { GameMap, Program } from "@/lib/model";
import { edgeKey, simulate, targetTrail, type Seg } from "@/lib/sim";

type Props = {
  map: GameMap;
  program: Program;
  /** Texto a mostrar al terminar en lugar del resultado de la misión. */
  outcome?: string;
  /** Empieza a animar solo al apretar ▶ (por defecto). */
  stepMs?: number;
  /** Arranca solo al aparecer (demostraciones del tutorial y "Probar"). */
  autoPlay?: boolean;
  /** "guide": dentro de la ventana violeta del tutorial. */
  tone?: "test" | "guide";
  /** Alto que se reserva para lo que rodea al mapa. */
  mapReserve?: number;
  onFinished?: () => void;
};

const CRASH_TEXT = {
  wall: "¡Ups! Ahí no hay puente. La misión falla.",
  rock: "¡Ups! Chocó con una roca. La misión falla.",
  edge: "¡Ups! Se salió del mapa. La misión falla.",
} as const;

export function RobotRunner({ map, program, outcome, stepMs = 550, autoPlay, tone = "test", mapReserve = 330, onFinished }: Props) {
  const result = useMemo(() => simulate(map, program), [map, program]);
  const ghost = useMemo(() => (map.kind === "canvas" ? targetTrail(map) : undefined), [map]);
  const [step, setStep] = useState<number>(autoPlay ? 0 : -1); // -1: sin empezar; k: se hicieron k movimientos
  const [running, setRunning] = useState(!!autoPlay);
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

  let robotState: RobotState = "normal";
  if (map.kind === "canvas") robotState = finished ? (result.ok ? "happy" : "normal") : step >= 0 ? "paint" : "normal";
  else if (finished) robotState = crashed ? "crash" : result.ok ? "happy" : "normal";

  let message: string | null = null;
  let good = false;
  if (finished) {
    if (outcome) {
      message = outcome;
      good = true;
    } else if (result.ok) {
      message = map.kind === "maze" ? "¡Llegó a la base! Misión cumplida." : "¡Dibujó la figura!";
      good = true;
    } else if (result.status === "crash") message = result.crashAt ? CRASH_TEXT[result.crashAt.reason] : "¡Ups! Se chocó. La misión falla.";
    else if (result.status === "off_base") message = "Terminó el programa fuera de la base. La misión falla.";
    else if (result.status === "wrong_figure") message = "Dibujó otra figura.";
    else message = result.detail;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-2 ring-[#EDE3CC]">
        <MapView map={map} robotAt={map.kind === "canvas" && step < 0 ? undefined : robotAt} robotState={robotState} visited={map.kind === "maze" ? visited : undefined} trail={map.kind === "canvas" ? (step < 0 ? new Set() : trail) : undefined} ghost={ghost} fit={{ maxScale: map.kind === "canvas" ? 2.4 : 1.4, reserve: mapReserve }} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-2 ring-[#EDE3CC]">
          <ProgramView program={program} running={highlight} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className={
              tone === "guide"
                ? "min-h-[44px] rounded-xl border-2 border-[#CFC2FA] bg-white px-4 py-1.5 text-base font-semibold text-[#3A2592] hover:bg-[#F6F3FF] disabled:opacity-50"
                : "rounded-xl bg-[#176CE0] px-4 py-2 text-base font-semibold text-white shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] disabled:opacity-50"
            }
          >
            {step < 0 ? "▶ Ejecutar" : running ? "Mirando…" : "↺ Ver de nuevo"}
          </button>
        </div>
        {message && <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${good ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message}</div>}
      </div>
    </div>
  );
}
