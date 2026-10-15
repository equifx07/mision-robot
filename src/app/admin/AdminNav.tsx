"use client";

// Menú lateral del panel. Arriba se elige qué prueba se mira (4.º, 5.º o 6.º, nunca juntas).
// En las páginas de resultados conserva el grado y los filtros elegidos al cambiar de sección.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const RESULTS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/comparacion", label: "Comparación entre colegios" },
  { href: "/admin/conceptos", label: "Conceptos y prácticas" },
  { href: "/admin/errores", label: "Errores y atención" },
  { href: "/admin/tiempos", label: "Tiempos" },
  { href: "/admin/items", label: "Calidad de las misiones" },
  { href: "/admin/estudiantes", label: "Estudiantes" },
];
const MANAGE = [
  { href: "/admin/en-vivo", label: "En vivo" },
  { href: "/explicacion", label: "Explicación (4.º y 5.º)" },
  { href: "/admin/colegios", label: "Colegios" },
  { href: "/admin/exportar", label: "Exportar y copias" },
  { href: "/admin/papelera", label: "Papelera" },
  { href: "/admin/colores", label: "Cómo leer los colores" },
];

export function AdminNav() {
  const path = usePathname();
  const params = useSearchParams();
  const g0 = params.get("grado");
  const grade = g0 === "4" || g0 === "5" ? g0 : "6";
  const query = params.toString();
  // En pantallas chicas el menú se abre con un botón; se cierra solo al cambiar de página.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path, query]);
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  const resultsPage = RESULTS.some((r) => isActive(r.href)) && !path.startsWith("/admin/estudiantes/");
  const item = (href: string, label: string, keepFilters: boolean) => {
    const active = isActive(href);
    const q = keepFilters ? query || `grado=${grade}` : "";
    return (
      <Link
        key={href}
        href={q ? `${href}?${q}` : href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[40px] items-center rounded-xl px-3 text-[15px] font-semibold leading-tight no-underline [@media(max-height:760px)]:min-h-[34px] ${active ? "bg-[#22211F] text-white" : "text-[#3D3A35] hover:bg-[#EFEBE3]"}`}
      >
        {label}
      </Link>
    );
  };
  // Al cambiar de grado se mantiene la página; los filtros de colegio y experiencia se conservan.
  const gradeHref = (g: "4" | "5" | "6") => {
    const p = new URLSearchParams(params.toString());
    p.set("grado", g);
    return `${resultsPage ? path : "/admin"}?${p.toString()}`;
  };
  const section = "px-2.5 pb-0.5 text-xs font-bold tracking-[0.08em] text-[#6B665E]";
  return (
    <>
      <div className="flex items-end gap-2 lg:flex-col lg:items-stretch lg:gap-1.5">
        <span className={`${section} hidden lg:block`}>PRUEBA</span>
        <div className="grid flex-1 grid-cols-3 gap-1 rounded-2xl bg-[#EFEBE3] p-1" role="group" aria-label="Qué prueba mirar">
          {(["4", "5", "6"] as const).map((g) => {
            const on = grade === g;
            return (
              <Link
                key={g}
                href={gradeHref(g)}
                aria-current={on ? "true" : undefined}
                aria-label={`${g}.º grado`}
                className={`flex min-h-[42px] items-center justify-center rounded-xl text-[17px] font-bold no-underline [@media(max-height:760px)]:min-h-[36px] ${on ? "bg-white text-[#22211F] shadow-sm" : "text-[#55504A] hover:text-[#22211F]"}`}
              >
                {g}.º
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="menu-panel"
          className="flex min-h-[50px] shrink-0 items-center gap-2 rounded-2xl border border-[#D8D3C8] bg-white px-4 text-[15px] font-semibold text-[#22211F] lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Menú
        </button>
      </div>
      <div id="menu-panel" className={`${open ? "grid" : "hidden"} grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-5 [@media(max-height:760px)]:lg:gap-3`}>
        <nav aria-label={`Resultados de ${grade}.º`} className="flex flex-col gap-0.5">
          <span className={section}>RESULTADOS DE {grade}.º</span>
          {RESULTS.map((r) => item(r.href, r.label, true))}
        </nav>
        <nav aria-label="Gestión" className="flex flex-col gap-0.5">
          <span className={section}>GESTIÓN</span>
          {MANAGE.map((r) => item(r.href, r.label, false))}
          <div className="mt-2 flex flex-col gap-1 px-3 text-sm lg:hidden">
            <a href="/preview" target="_blank" className="text-[#3D3A35] underline-offset-2 hover:underline">
              Ver las misiones ↗
            </a>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="text-[#3D3A35] underline-offset-2 hover:underline">
                Salir
              </button>
            </form>
          </div>
        </nav>
      </div>
    </>
  );
}
