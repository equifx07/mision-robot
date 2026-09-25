import { Suspense } from "react";
import { PruebaClient } from "./PruebaClient";

export default function PruebaPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Cargando…</p>}>
      <PruebaClient />
    </Suspense>
  );
}
