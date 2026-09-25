"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Contraseña incorrecta");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/10">
        <h1 className="text-xl font-black text-slate-900">Panel de administración</h1>
        <label className="text-sm font-semibold text-slate-700">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </label>
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" disabled={busy || !password} className="rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          Entrar
        </button>
      </form>
    </div>
  );
}
