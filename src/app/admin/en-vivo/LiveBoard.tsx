"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, Chip } from "@/components/admin/ui";
import type { Tone } from "@/lib/semaforo";
import { discardLiveAttemptAction, discardStaleAction, endLiveAttemptAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";

export type LiveItem = {
  id: string;
  name: string;
  school: string;
  course: string;
  startedAt: number;
  lastActivity: number;
  /** Ya mandó alguna señal de vida (las pruebas anteriores a esta función no tienen). */
  pinged: boolean;
  where: string | null;
  answered: number;
  total: number;
};

/** La pestaña abierta avisa cada 20 s; en segundo plano el navegador puede espaciarlo a 1 por minuto. */
const ONLINE_MS = 75_000;
/** Sin ninguna señal en este tiempo, se considera abandonada. */
const STALE_MIN = 15;

type State = { key: "online" | "quiet" | "stale"; label: string; tone: Tone };
const STATES: Record<State["key"], State> = {
  online: { key: "online", label: "Rindiendo", tone: "bien" },
  quiet: { key: "quiet", label: "Sin señal", tone: "intermedio" },
  stale: { key: "stale", label: "Abandonada", tone: "bajo" },
};

function stateOf(r: LiveItem, now: number): State {
  const idle = now - r.lastActivity;
  if (idle >= STALE_MIN * 60000) return STATES.stale;
  return idle < ONLINE_MS ? STATES.online : STATES.quiet;
}

function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${m % 60} min` : `${Math.floor(h / 24)} d ${h % 24} h`;
}

export function LiveBoard({ rows, serverNow }: { rows: LiveItem[]; serverNow: number }) {
  const router = useRouter();
  // Hora del servidor, avanzando con el reloj local (por si la compu del panel tiene otra hora).
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = serverNow - Date.now();
    setNow(Date.now() + offset);
    const tick = window.setInterval(() => setNow(Date.now() + offset), 1000);
    return () => window.clearInterval(tick);
  }, [serverNow]);
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(id);
  }, [router]);

  const groups = (["online", "quiet", "stale"] as const).map((k) => ({ state: STATES[k], rows: rows.filter((r) => stateOf(r, now).key === k) }));
  const online = groups[0].rows.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-4 py-3" style={{ borderColor: C.line }}>
        <span className="relative flex h-3 w-3" aria-hidden>
          <span className={`absolute inline-flex h-full w-full rounded-full ${online ? "animate-ping bg-[#2E9E6A] opacity-60" : ""}`} />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${online ? "bg-[#2E9E6A]" : "bg-[#C9C3B6]"}`} />
        </span>
        <span className="text-[17px] font-semibold">
          {online === 0 ? "Nadie rindiendo ahora" : `${online} ${online === 1 ? "chico rindiendo" : "chicos rindiendo"} ahora`}
        </span>
        <span className="text-sm" style={{ color: C.muted }}>
          {groups[1].rows.length} sin señal · {groups[2].rows.length} abandonadas
        </span>
      </div>

      {rows.length === 0 && (
        <p className="m-0 rounded-2xl border bg-white px-4 py-6 text-center" style={{ borderColor: C.line, color: C.secondary }}>
          No hay pruebas abiertas.
        </p>
      )}

      {groups.map(
        ({ state, rows: list }) =>
          list.length > 0 && (
            <section key={state.key} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="m-0 text-lg font-bold">
                    {state.key === "online" ? "Rindiendo ahora" : state.key === "quiet" ? "Sin señal" : "Abandonadas"} ({list.length})
                  </h2>
                  <p className="m-0 text-sm" style={{ color: C.secondary }}>
                    {state.key === "online"
                      ? "Tienen la prueba abierta en pantalla."
                      : state.key === "quiet"
                        ? "Hace más de un minuto que no llega señal: puede que hayan cerrado la pestaña, que se cortó internet o que la compu se suspendió. Si vuelven a abrir, siguen donde estaban."
                        : `Más de ${STALE_MIN} minutos sin ninguna señal. Si nadie las va a retomar, descartalas para que no queden abiertas.`}
                  </p>
                </div>
                {state.key === "stale" && (
                  <form action={discardStaleAction}>
                    <input type="hidden" name="minutos" value={STALE_MIN} />
                    <ConfirmButton
                      message={`¿Mandar a la papelera las ${list.length} pruebas abandonadas? No cuentan en los resultados. Se pueden recuperar desde la Papelera.`}
                      className="min-h-[40px] rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Descartar las {list.length} abandonadas
                    </ConfirmButton>
                  </form>
                )}
              </div>
              <div className="overflow-x-auto rounded-[20px] border bg-white" style={{ borderColor: C.line }}>
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs font-bold tracking-[0.06em]" style={{ background: "#FAF8F4", color: C.muted }}>
                    <tr>
                      <th className="px-3 py-2.5">NOMBRE</th>
                      <th className="px-3 py-2.5">COLEGIO</th>
                      <th className="px-3 py-2.5">CURSO</th>
                      <th className="px-3 py-2.5">VA POR</th>
                      <th className="px-3 py-2.5">PROGRESO</th>
                      <th className="px-3 py-2.5">TIEMPO</th>
                      <th className="px-3 py-2.5">ÚLTIMA SEÑAL</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => {
                      const pct = r.total ? r.answered / r.total : 0;
                      return (
                        <tr key={r.id} className="border-t" style={{ borderColor: "#F0EDE6" }}>
                          <td className="px-3 py-2.5 font-semibold">
                            <a href={`/admin/estudiantes/${r.id}`} className="text-[#22211F] underline decoration-[#C9C3B6] underline-offset-2 hover:decoration-[#22211F]">
                              {r.name}
                            </a>
                          </td>
                          <td className="px-3 py-2.5">{r.school}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{r.course}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{r.where ?? (r.answered ? `Misión ${Math.min(r.answered + 1, r.total)}` : "Explicación inicial")}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-[#EFEBE3]" role="progressbar" aria-valuemin={0} aria-valuemax={r.total} aria-valuenow={r.answered}>
                                <div className="h-full rounded-full bg-[#22211F]" style={{ width: `${pct * 100}%` }} />
                              </div>
                              <span className="whitespace-nowrap tabular-nums">
                                {r.answered}/{r.total}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{duration(now - r.startedAt)}</td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="flex flex-col items-start gap-0.5">
                              <Chip tone={state.tone}>{state.label}</Chip>
                              <span className="text-xs tabular-nums" style={{ color: C.muted }}>
                                hace {duration(now - r.lastActivity)}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="flex justify-end gap-1.5">
                              <form action={endLiveAttemptAction}>
                                <input type="hidden" name="id" value={r.id} />
                                <ConfirmButton
                                  message={`¿Terminar la prueba de ${r.name}? Se corrige con las ${r.answered} misiones que contestó; las que faltan cuentan como no contestadas. Si tiene la prueba abierta, le aparece que terminó.`}
                                  className="min-h-[36px] rounded-lg border border-[#D8D3C8] px-2.5 text-[13px] font-semibold text-[#3D3A35] hover:bg-[#EFEBE3]"
                                >
                                  Terminar
                                </ConfirmButton>
                              </form>
                              <form action={discardLiveAttemptAction}>
                                <input type="hidden" name="id" value={r.id} />
                                <ConfirmButton
                                  message={`¿Descartar la prueba de ${r.name}? Va a la papelera y no cuenta en los resultados. Si tiene la prueba abierta, le aparece que se cerró. Se puede recuperar desde la Papelera.`}
                                  className="min-h-[36px] rounded-lg border border-red-200 px-2.5 text-[13px] font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Descartar
                                </ConfirmButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ),
      )}
      <p className="m-0 text-xs" style={{ color: C.muted }}>
        Terminar: la prueba se corrige con lo que contestó y cuenta en los resultados. Descartar: va a la papelera y no cuenta.
      </p>
    </div>
  );
}
