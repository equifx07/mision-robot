"use client";

// Vista previa de la explicación inicial y de las prácticas, en el orden en que las ve el alumno.
// /preview/tutorial?n=0 — se avanza con los botones de la propia ventana.

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { introScreens, practiceScreens, TutorialModal, type GuideScreen } from "@/components/Tutorial";
import { ITEMS } from "@/lib/items";
import { PRACTICES } from "@/lib/tutorial";

type Entry = { screen: GuideScreen; key: string; step: { index: number; total: number }; context?: string; note: string; label: string };

const intro = introScreens();
const ENTRIES: Entry[] = [
  ...intro.map((screen, i) => ({
    screen,
    key: `intro-${i}`,
    step: { index: i, total: intro.length },
    note: "La prueba todavía no empezó. Nada de esto cuenta.",
    label: `Explicación inicial ${i + 1} de ${intro.length}`,
  })),
  ...Object.entries(PRACTICES).flatMap(([id, p]) => {
    const n = ITEMS.findIndex((it) => it.id === id) + 1;
    const screens = practiceScreens(p);
    return screens.map((screen, i) => ({
      screen,
      key: `${id}-${i}`,
      step: { index: i, total: screens.length },
      context: `Antes de la misión ${n}`,
      note: "Esto no cuenta para el resultado.",
      label: `Antes de ${id} · ${i + 1} de ${screens.length}`,
    }));
  }),
];

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const n = Math.min(ENTRIES.length - 1, Math.max(0, Number(params.get("n") ?? 0) || 0));
  const go = (k: number) => router.replace(`/preview/tutorial?n=${(k + ENTRIES.length) % ENTRIES.length}`);
  const e = ENTRIES[n];
  return (
    <div className="min-h-screen">
      <div className="fixed left-3 top-2 z-40 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow">
        Vista del tutorial · {e.label} · pantalla {n + 1} de {ENTRIES.length}
      </div>
      <TutorialModal
        key={e.key}
        screen={e.screen}
        screenKey={e.key}
        step={e.step}
        context={e.context}
        note={e.note}
        onBack={() => go(n - 1)}
        onNext={() => go(n + 1)}
        nextLabel="Siguiente →"
      />
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
