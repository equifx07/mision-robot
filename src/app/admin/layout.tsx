import { Suspense } from "react";
import { Figtree } from "next/font/google";
import { isAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

// Texto del panel en Figtree; los títulos usan Fredoka (la misma de la prueba).
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className={`${figtree.variable} min-h-screen bg-[#F6F4EF] text-[#22211F]`} style={{ fontFamily: "var(--font-figtree), system-ui, sans-serif" }}>
      {admin ? (
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="flex shrink-0 flex-col gap-6 border-b border-[#E5E1D8] bg-white px-4 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:py-7">
            <div className="flex flex-col gap-0.5 px-2.5">
              <span className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold">Misión Robot</span>
              <span className="text-sm text-[#6B665E]">Panel de resultados</span>
            </div>
            <Suspense fallback={null}>
              <AdminNav />
            </Suspense>
            <div className="mt-auto flex flex-col gap-2 px-2.5 text-sm">
              <a href="/preview" target="_blank" className="text-[#3D3A35] underline-offset-2 hover:underline">
                Ver las misiones ↗
              </a>
              <form action="/api/admin/logout" method="post">
                <button type="submit" className="text-[#3D3A35] underline-offset-2 hover:underline">
                  Salir
                </button>
              </form>
            </div>
          </aside>
          <main className="min-w-0 flex-1 px-5 pb-12 pt-8 sm:px-10 lg:px-12">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-7">{children}</div>
          </main>
        </div>
      ) : (
        <main className="px-4 py-6">{children}</main>
      )}
    </div>
  );
}
