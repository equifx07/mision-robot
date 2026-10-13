import { requireAdmin } from "@/lib/auth";
import { courseLabel } from "@/lib/divisions";
import { lastActivity, listLive } from "@/lib/repo";
import { testOf } from "@/lib/tests";
import { PageHeader } from "@/components/admin/ui";
import { LiveBoard, type LiveItem } from "./LiveBoard";

export const dynamic = "force-dynamic";

/** Pruebas que se están haciendo: se actualiza sola cada pocos segundos (ver LiveBoard). */
export default async function LivePage() {
  await requireAdmin();
  const rows: LiveItem[] = listLive().map((r) => ({
    id: r.id,
    name: r.student_name,
    school: r.school_name,
    course: courseLabel(r.grade, r.division),
    startedAt: Date.parse(r.started_at),
    lastActivity: lastActivity(r),
    pinged: !!r.last_seen_at,
    where: r.live_where,
    answered: Number(r.answered),
    total: testOf(r.grade).items.length,
  }));
  return (
    <>
      <PageHeader
        title="En vivo"
        subtitle="Las pruebas que se están haciendo ahora, de 4.º y de 6.º. Se actualiza sola cada 5 segundos. Si un chico cierra la pestaña, su prueba queda abierta: desde acá la podés terminar o descartar."
      />
      <LiveBoard rows={rows} serverNow={Date.now()} />
    </>
  );
}
