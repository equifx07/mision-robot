import { StartForm } from "@/components/StartForm";
import { Robot } from "@/components/MapView";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <svg width="76" height="76" viewBox="-34 -36 68 68" aria-hidden>
          <Robot x={0} y={0} scale={1.15} />
        </svg>
        <div>
          <h1 className="text-4xl font-black text-slate-800">Misión Robot</h1>
          <p className="text-slate-600">Desafíos para pensar como un programador</p>
        </div>
      </div>
      <p className="max-w-lg text-center text-slate-600">Completá tus datos para empezar. Después vas a ver una explicación con ejemplos antes de la primera misión.</p>
      <StartForm />
      <p className="text-xs text-slate-400">EPC-6 · Evaluación de Pensamiento Computacional para 6.º grado</p>
    </main>
  );
}
