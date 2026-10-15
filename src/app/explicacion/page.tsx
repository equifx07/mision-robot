import { Suspense } from "react";
import { Explainer } from "./Explainer";

export const metadata = { title: "Explicación · Misión Robot" };

export default function ExplicacionPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Cargando…</p>}>
      <Explainer />
    </Suspense>
  );
}
