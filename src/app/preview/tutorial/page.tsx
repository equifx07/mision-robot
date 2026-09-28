"use client";

// Vista previa de la explicación inicial y de las prácticas, en el orden en que las ve el alumno.
// /preview/tutorial?n=0

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntroStepContent, PracticeContent } from "@/components/Tutorial";
import { INTRO, PRACTICES } from "@/lib/tutorial";

const SCREENS: { label: string; render: () => React.ReactNode }[] = [
  ...INTRO.map((step, i) => ({
    label: `Explicación ${i + 1} de ${INTRO.length}`,
    render: () => <IntroStepContent step={step} stepKey={`i${i}`} />,
  })),
  ...Object.entries(PRACTICES).map(([id, p]) => ({
    label: `Práctica antes de ${id}`,
    render: () => <PracticeContent practice={p} practiceKey={id} />,
  })),
];

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const n = Math.min(SCREENS.length - 1, Math.max(0, Number(params.get("n") ?? 0) || 0));
  const go = (k: number) => router.replace(`/preview/tutorial?n=${(k + SCREENS.length) % SCREENS.length}`);
  const screen = SCREENS[n];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2">
          <span className="font-black text-slate-800">Vista del tutorial</span>
          <span className="text-sm font-semibold text-slate-600">
            {screen.label} · pantalla {n + 1} de {SCREENS.length}
          </span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => go(n - 1)} className="rounded-xl px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100">
              ← Anterior
            </button>
            <button type="button" onClick={() => go(n + 1)} className="rounded-xl bg-[#176CE0] px-3 py-1.5 font-semibold text-white">
              Siguiente →
            </button>
          </div>
        </div>
      </header>
      <div key={n} className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
        {screen.render()}
      </div>
    </div>
  );
}

export default function PreviewTutorial() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Cargando…</p>}>
      <Inner />
    </Suspense>
  );
}
