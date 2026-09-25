import Link from "next/link";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Resumen"],
  ["/admin/colegios", "Colegios"],
  ["/admin/estudiantes", "Estudiantes"],
  ["/admin/items", "Ítems"],
  ["/admin/exportar", "Exportar"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {admin && (
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/admin" className="font-black text-slate-900">
              Misión Robot · Panel
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
                  {label}
                </Link>
              ))}
              <Link href="/preview" className="rounded-lg px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-100" target="_blank">
                Ver ítems ↗
              </Link>
            </nav>
            <form action="/api/admin/logout" method="post" className="ml-auto">
              <button type="submit" className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
                Salir
              </button>
            </form>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
