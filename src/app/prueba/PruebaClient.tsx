"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ATTEMPT_KEY } from "@/components/StartForm";
import { TestRunner } from "@/components/TestRunner";

export function PruebaClient() {
  const params = useSearchParams();
  const [attemptId, setAttemptId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const fromUrl = params.get("a");
    if (fromUrl) {
      try {
        localStorage.setItem(ATTEMPT_KEY, fromUrl);
      } catch {
        /* sin localStorage */
      }
      setAttemptId(fromUrl);
      return;
    }
    try {
      setAttemptId(localStorage.getItem(ATTEMPT_KEY));
    } catch {
      setAttemptId(null);
    }
  }, [params]);

  if (attemptId === undefined) return <p className="p-10 text-center text-slate-500">Cargando…</p>;
  if (!attemptId)
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-slate-700">No hay ninguna prueba empezada en este dispositivo.</p>
        <a href="/" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">
          Ir al inicio
        </a>
      </div>
    );
  return <TestRunner attemptId={attemptId} />;
}
