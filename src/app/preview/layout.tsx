import { requireAdmin } from "@/lib/auth";

// Las vistas previas muestran las misiones con sus respuestas: solo para el administrador.
export const dynamic = "force-dynamic";

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
