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
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-[20px] border border-[#E5E1D8] bg-white p-6">
        <div className="flex flex-col gap-0.5">
          <span className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold">Misión Robot</span>
          <h1 className="m-0 text-base font-semibold text-[#55504A]">Panel de resultados</h1>
        </div>
        <label className="text-sm font-semibold text-[#3D3A35]">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-[#D8D3C8] px-3 py-2 text-base focus:border-[#22211F] focus:outline-none"
            autoFocus
          />
        </label>
        {error && <p className="m-0 rounded-xl bg-[#FADBD6] px-3 py-2 text-sm font-semibold text-[#9B2019]">{error}</p>}
        <button type="submit" disabled={busy || !password} className="min-h-[44px] rounded-xl bg-[#22211F] px-4 font-bold text-white hover:bg-black disabled:opacity-50">
          Entrar
        </button>
      </form>
    </div>
  );
}
