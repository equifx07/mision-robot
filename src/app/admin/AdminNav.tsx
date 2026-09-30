"use client";

// Menú lateral del panel. En las páginas de resultados conserva los filtros elegidos al cambiar de sección.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const RESULTS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/comparacion", label: "Comparación entre colegios" },
  { href: "/admin/conceptos", label: "Conceptos y prácticas" },
  { href: "/admin/items", label: "Calidad de las misiones" },
  { href: "/admin/estudiantes", label: "Estudiantes" },
];
const MANAGE = [
  { href: "/admin/colegios", label: "Colegios y cursos" },
  { href: "/admin/exportar", label: "Exportar datos" },
  { href: "/admin/colores", label: "Cómo leer los colores" },
];

export function AdminNav() {
  const path = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  const item = (href: string, label: string, keepFilters: boolean) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={keepFilters && query ? `${href}?${query}` : href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-semibold no-underline ${active ? "bg-[#22211F] text-white" : "text-[#3D3A35] hover:bg-[#EFEBE3]"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="px-2.5 pb-1 text-xs font-bold tracking-[0.08em] text-[#6B665E]">RESULTADOS</span>
        {RESULTS.map((r) => item(r.href, r.label, true))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-2.5 pb-1 text-xs font-bold tracking-[0.08em] text-[#6B665E]">GESTIÓN</span>
        {MANAGE.map((r) => item(r.href, r.label, false))}
      </div>
    </>
  );
}
