"use client";

// Vista "como la ve el alumno" de cada misión, para revisar el diseño sin rendir la prueba.
// /preview/prueba?i=A2.2 (con &sel=0 aparece elegida la opción a)

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemView } from "@/components/ItemView";
import { ITEMS } from "@/lib/items";

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const found = ITEMS.findIndex((it) => it.id === params.get("i"));
  const index = found < 0 ? 0 : found;
  const item = ITEMS[index];
  const initial = params.get("sel");
  const [selected, setSelected] = useState<number | null>(initial === null ? null : Number(initial));

  useEffect(() => setSelected(initial === null ? null : Number(initial)), [item.id, initial]);

  const go = (k: number) => router.replace(`/preview/prueba?i=${ITEMS[(k + ITEMS.length) % ITEMS.length].id}`);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2">
          <span className="font-black text-slate-800">Vista del alumno</span>
          <span className="whitespace-nowrap text-sm font-semibold text-slate-600">
            Misión {index + 1} de {ITEMS.length} · {item.id}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#176CE0]" style={{ width: `${(index / ITEMS.length) * 100}%` }} />
          </div>
          <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">⏱ 0 min</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-4">
        <ItemView key={item.id} item={item} index={index} total={ITEMS.length} selected={selected} onSelect={setSelected} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2">
          <button type="button" onClick={() => go(index - 1)} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">
            ← Anterior
          </button>
          <span className="text-sm text-slate-600">{selected === null ? "Elegí una opción." : "¿Lista tu respuesta?"}</span>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="rounded-2xl bg-[#0F8743] px-6 py-2.5 text-lg font-semibold text-white shadow-[inset_0_-4px_0_#0A6231] hover:bg-[#0D7A3C]"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPrueba() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Cargando…</p>}>
      <Inner />
    </Suspense>
  );
}
