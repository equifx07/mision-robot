import { requireAdmin } from "@/lib/auth";

// La Explicación se abre desde el panel (con la contraseña) y se proyecta en el aula.
export const dynamic = "force-dynamic";

export default async function ExplicacionLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
