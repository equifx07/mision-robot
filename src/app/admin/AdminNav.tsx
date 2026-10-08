"use client";

// Menú lateral del panel. Arriba se elige qué prueba se mira (4.º o 6.º, nunca las dos juntas).
// En las páginas de resultados conserva el grado y los filtros elegidos al cambiar de sección.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
  { href: "/admin/colegios", label: "Colegios" },
  { href: "/admin/exportar", label: "Exportar datos" },
  { href: "/admin/colores", label: "Cómo leer los colores" },
];

export function AdminNav() {
  const path = usePathname();
  const params = useSearchParams();
  const grade = params.get("grado") === "4" ? "4" : "6";
  const query = params.toString();
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
        className={`flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-semibold no-underline ${active ? "bg-[#22211F] text-white" : "text-[#3D3A35] hover:bg-[#EFEBE3]"}`}
      >
        {label}
      </Link>
    );
  };
  // Al cambiar de grado se mantiene la página; los filtros de colegio y experiencia se conservan.
  const gradeHref = (g: "4" | "6") => {
    const p = new URLSearchParams(params.toString());
    p.set("grado", g);
    return `${resultsPage ? path : "/admin"}?${p.toString()}`;
  };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="px-2.5 text-xs font-bold tracking-[0.08em] text-[#6B665E]">PRUEBA</span>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EFEBE3] p-1" role="group" aria-label="Qué prueba mirar">
          {(["4", "6"] as const).map((g) => {
            const on = grade === g;
            return (
              <Link
                key={g}
                href={gradeHref(g)}
                aria-current={on ? "true" : undefined}
                className={`flex min-h-[44px] items-center justify-center rounded-xl text-[17px] font-bold no-underline ${on ? "bg-white text-[#22211F] shadow-sm" : "text-[#55504A] hover:text-[#22211F]"}`}
              >
                {g}.º grado
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-2.5 pb-1 text-xs font-bold tracking-[0.08em] text-[#6B665E]">RESULTADOS DE {grade}.º</span>
        {RESULTS.map((r) => item(r.href, r.label, true))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-2.5 pb-1 text-xs font-bold tracking-[0.08em] text-[#6B665E]">GESTIÓN</span>
        {MANAGE.map((r) => item(r.href, r.label, false))}
      </div>
    </>
  );
}
