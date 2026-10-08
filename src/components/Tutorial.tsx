"use client";

// Tutorial en formato de ventana emergente (violeta), bien distinto de las misiones de la prueba:
// fondo oscurecido, franja "EXPLICACIÓN · Solo mirá" o "PRÁCTICA · No cuenta", el robot guía que
// habla en un globo, demostraciones que arrancan solas y botones violetas. Las misiones de la
// prueba nunca usan el violeta. Diseño: https://claude.ai/artifact/M45qd4s6ithwSCrCHBHdn9
// La usan TestRunner y la vista previa /preview/tutorial.

import { useState, type ReactNode } from "react";
import { BlockChip, PieceView } from "@/components/ProgramView";
import { RobotRunner } from "@/components/RobotRunner";
import { TryIt } from "@/components/TryIt";
import { robotSvg } from "@/lib/art";
import type { ItemA } from "@/lib/model";
import { INTRO, LEGEND, TRY_AFTER_DEMO, type Demo, type Fact, type Practice } from "@/lib/tutorial";

/** Colores del modo guía (no aparecen en las misiones). */
export const GUIDE = {
  main: "#6B4FD8",
  dark: "#3A2592",
  ink: "#2C1D7A",
  muted: "#5B4B9A",
  bubble: "#EFEAFF",
  panel: "#F6F3FF",
  line: "#E3DBFF",
  backdrop: "rgba(35, 28, 69, 0.8)",
};

/** Una pantalla del tutorial: lo que dice el robot y lo que se ve al costado. */
export type GuideScreen = {
  mode: "explicacion" | "practica";
  title: string;
  lines: string[];
  demos?: Demo[];
  tryIt?: ItemA;
  legend?: boolean;
  facts?: Fact[];
};

/** Pantallas de la explicación inicial. `count`: cantidad de misiones de la prueba del chico. */
export function introScreens(count = 25): GuideScreen[] {
  const n = (t: string) => t.split("{n}").join(String(count));
  return INTRO.map((s) => ({
    mode: s.tryIt ? "practica" : "explicacion",
    title: s.title,
    lines: s.lines,
    demos: s.demo ? [s.demo] : undefined,
    tryIt: s.tryIt,
    legend: s.legend,
    facts: s.facts?.map((f) => ({ ...f, badge: n(f.badge), title: n(f.title), text: n(f.text) })),
  }));
}

/** Una práctica se parte en pantallas: primero la explicación con su ejemplo y después cada "Probá vos". */
export function practiceScreens(p: Practice): GuideScreen[] {
  const out: GuideScreen[] = [];
  const tries = p.tries ?? [];
  const hasDemos = p.demos.length > 0;
  if (hasDemos || tries.length === 0) out.push({ mode: "explicacion", title: p.title, lines: p.lines, demos: hasDemos ? p.demos : undefined });
  for (const t of tries) {
    out.push(hasDemos ? { mode: "practica", title: TRY_AFTER_DEMO.title, lines: TRY_AFTER_DEMO.lines, tryIt: t } : { mode: "practica", title: p.title, lines: p.lines, tryIt: t });
  }
  return out;
}

// ───────── Piezas ─────────

function EyeIcon({ size, fg, bg }: { size: number; fg: string; bg: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M12 5.5C6.8 5.5 3.1 9.3 1.8 12c1.3 2.7 5 6.5 10.2 6.5s8.9-3.8 10.2-6.5C20.9 9.3 17.2 5.5 12 5.5Z" fill={fg} />
      <circle cx="12" cy="12" r="4.2" fill={bg} />
      <circle cx="12" cy="12" r="1.8" fill={fg} />
    </svg>
  );
}

function PencilIcon({ size, fg }: { size: number; fg: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill={fg} />
    </svg>
  );
}

function GuideRobot() {
  return <svg width="100" height="117" viewBox="0 0 120 140" role="img" aria-label="Robot guía" dangerouslySetInnerHTML={{ __html: robotSvg("happy") }} />;
}

function Dots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex gap-[7px]" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full"
          style={{ background: i === index ? "#FFFFFF" : i < index ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.32)", boxShadow: i === index ? "0 0 0 3px rgba(255,255,255,0.3)" : undefined }}
        />
      ))}
    </div>
  );
}

function Speech({ title, lines, titleId, wide }: { title: string; lines: string[]; titleId: string; wide: boolean }) {
  return (
    <div className={`flex shrink-0 flex-col gap-1.5 ${wide ? "mx-auto w-full max-w-2xl" : "lg:w-[360px]"}`}>
      <div className="relative flex flex-col gap-2.5 rounded-3xl px-5 py-4" style={{ background: GUIDE.bubble }}>
        <h2 id={titleId} className="m-0 text-2xl font-bold leading-tight" style={{ color: GUIDE.ink }}>
          {title}
        </h2>
        {lines.map((l, i) => (
          <p key={i} className="m-0 text-lg leading-snug text-[#1F2B45]">
            {l}
          </p>
        ))}
        <span aria-hidden className="absolute -bottom-[11px] left-12 h-6 w-6 rotate-45" style={{ background: GUIDE.bubble }} />
      </div>
      <div className="flex items-end gap-2.5 pl-3.5">
        <GuideRobot />
        <span className="pb-3.5 text-[15px] font-semibold" style={{ color: GUIDE.muted }}>
          Robot guía
        </span>
      </div>
    </div>
  );
}

function Panel({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-[22px] border-2 p-4" style={{ background: GUIDE.panel, borderColor: GUIDE.line }}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {icon}
        <span className="text-xl font-bold" style={{ color: GUIDE.ink }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-base" style={{ color: GUIDE.muted }}>
            · {subtitle}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/** Demostraciones: arrancan solas; si hay más de una, se eligen con pestañas. */
function Demos({ demos, keyPrefix }: { demos: Demo[]; keyPrefix: string }) {
  const [i, setI] = useState(0);
  const d = demos[i];
  return (
    <>
      {demos.length > 1 && (
        <div className="flex gap-2">
          {demos.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === i}
              onClick={() => setI(k)}
              className="min-h-[40px] rounded-full border-2 px-4 text-base font-semibold"
              style={k === i ? { background: GUIDE.main, borderColor: GUIDE.main, color: "#FFFFFF" } : { background: "#FFFFFF", borderColor: "#CFC2FA", color: GUIDE.dark }}
            >
              Ejemplo {k + 1}
            </button>
          ))}
        </div>
      )}
      <RobotRunner key={`${keyPrefix}-${i}`} map={d.map} program={d.program} outcome={d.outcome} autoPlay tone="guide" mapReserve={demos.length > 1 ? 410 : 370} />
    </>
  );
}

function Legend() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-flow-row-dense sm:grid-cols-2">
      {LEGEND.map((l) => (
        <div key={l.title} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 pb-2 pt-2.5 ring-2 ring-[#E3DBFF] ${l.title.length > 28 ? "sm:col-span-2" : ""}`}>
          {l.block ? (
            <PieceView blocks={[l.block]} size="compact" />
          ) : (
            <BlockChip fam={l.fam} size="compact">
              {l.title}
            </BlockChip>
          )}
          <span className="min-w-[150px] flex-1 text-sm text-slate-700">{l.text}</span>
        </div>
      ))}
    </div>
  );
}

function Facts({ facts }: { facts: Fact[] }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {facts.map((f) => (
        <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-2 ring-[#E3DBFF]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: GUIDE.main }}>
            {f.badge}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold" style={{ color: GUIDE.ink }}>
              {f.title}
            </span>
            <span className="text-base leading-snug text-slate-700">{f.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RightPanel({ screen, screenKey }: { screen: GuideScreen; screenKey: string }) {
  if (screen.tryIt)
    return (
      <Panel icon={<PencilIcon size={22} fg={GUIDE.main} />} title="Probá acá" subtitle="en la prueba no vas a tener el botón Probar">
        <TryIt key={screen.tryIt.id} item={screen.tryIt} />
      </Panel>
    );
  if (screen.demos?.length)
    return (
      <Panel icon={<EyeIcon size={22} fg={GUIDE.main} bg="#FFFFFF" />} title="Mirá el ejemplo" subtitle="el robot lo hace solo">
        <Demos demos={screen.demos} keyPrefix={screenKey} />
      </Panel>
    );
  if (screen.legend)
    return (
      <Panel icon={<EyeIcon size={22} fg={GUIDE.main} bg="#FFFFFF" />} title="Los bloques" subtitle="antes de usar cada uno vas a ver un ejemplo">
        <Legend />
      </Panel>
    );
  if (screen.facts?.length)
    return (
      <Panel icon={<EyeIcon size={22} fg={GUIDE.main} bg="#FFFFFF" />} title="Así va a ser la prueba">
        <Facts facts={screen.facts} />
      </Panel>
    );
  return null;
}

// ───────── Ventana ─────────

type ModalProps = {
  screen: GuideScreen;
  /** Identifica la pantalla (reinicia demostraciones y prácticas al cambiar). */
  screenKey: string;
  step?: { index: number; total: number };
  /** Texto chico en la franja cuando no hay pasos (p. ej. "Antes de la misión 3"). */
  context?: string;
  note: string;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
};

export function TutorialModal({ screen, screenKey, step, context, note, onBack, onNext, nextLabel }: ModalProps) {
  const practice = screen.mode === "practica";
  const titleId = `guia-${screenKey.replace(/[^A-Za-z0-9_-]/g, "")}`;
  const hasRight = !!(screen.tryIt || screen.demos?.length || screen.legend || screen.facts?.length);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4" style={{ background: GUIDE.backdrop }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-full w-full max-w-[1100px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(10,6,30,0.45)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2.5 text-white sm:px-7" style={{ background: GUIDE.main }}>
          <div className="flex flex-wrap items-center gap-3">
            {practice ? <PencilIcon size={26} fg="#FFFFFF" /> : <EyeIcon size={28} fg="#FFFFFF" bg={GUIDE.main} />}
            <span className="text-xl font-bold tracking-[0.06em]">{practice ? "PRÁCTICA" : "EXPLICACIÓN"}</span>
            <span className="rounded-full bg-white/20 px-3.5 py-1 text-base font-semibold">
              {practice ? "No cuenta: podés equivocarte y volver a probar" : "Solo mirá: no hay que resolver nada"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {step && step.total > 1 && <Dots index={step.index} total={step.total} />}
            {step && step.total > 1 ? (
              <span className="text-base font-semibold">
                Paso {step.index + 1} de {step.total}
              </span>
            ) : (
              context && <span className="text-base font-semibold">{context}</span>
            )}
          </div>
        </div>
        <div key={screenKey} className={`flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-4 pt-5 sm:px-7 lg:flex-row ${hasRight ? "lg:items-start" : "lg:justify-center"}`}>
          <Speech title={screen.title} lines={screen.lines} titleId={titleId} wide={!hasRight} />
          <RightPanel screen={screen} screenKey={screenKey} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#F0ECFB] px-5 py-3 sm:px-7">
          {onBack ? (
            <button type="button" onClick={onBack} className="min-h-[48px] rounded-xl px-4 text-lg font-semibold hover:bg-[#F6F3FF]" style={{ color: GUIDE.muted }}>
              ← Atrás
            </button>
          ) : (
            <span className="min-w-[1px]" />
          )}
          <span className="text-base" style={{ color: GUIDE.muted }}>
            {note}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="min-h-[52px] rounded-2xl px-7 text-xl font-bold text-white hover:brightness-110"
            style={{ background: GUIDE.main, boxShadow: `inset 0 -4px 0 ${GUIDE.dark}` }}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
