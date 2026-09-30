// Piezas de la interfaz del panel: base neutra cálida, sin azules; el color lo pone el semáforo.
import type { ReactNode } from "react";
import { TONES, type Tone } from "@/lib/semaforo";

export const C = {
  ink: "#22211F",
  ink2: "#3D3A35",
  muted: "#6B665E",
  secondary: "#55504A",
  line: "#E5E1D8",
  soft: "#EFEBE3",
  page: "#F6F4EF",
};

export const HEADING = "font-[family-name:var(--font-fredoka)]";

export function Chip({ tone, children, strong, className = "" }: { tone: Tone; children: ReactNode; strong?: boolean; className?: string }) {
  const t = TONES[tone];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-bold ${className}`} style={strong ? { background: t.fill, color: t.text } : { background: t.tint, color: t.ink }}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, aside }: { title: string; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-3xl flex-col gap-1.5">
        <h1 className={`${HEADING} m-0 text-[34px] font-semibold leading-tight`}>{title}</h1>
        {subtitle && <p className="m-0 text-[17px]" style={{ color: C.secondary }}>{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}

export function SectionIndex({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="En esta página" className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold" style={{ color: C.muted }}>
        En esta página:
      </span>
      {items.map((it, i) => (
        <a key={it.id} href={`#${it.id}`} className="rounded-full border bg-white px-3.5 py-1.5 text-sm font-semibold no-underline hover:bg-[#EFEBE3]" style={{ borderColor: "#D8D3C8", color: C.ink }}>
          {i + 1} · {it.label}
        </a>
      ))}
    </nav>
  );
}

export function Kpi({ label, value, unit, chip, sub }: { label: string; value: ReactNode; unit?: string; chip?: { tone: Tone; label: string }; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] border bg-white p-[18px]" style={{ borderColor: C.line }}>
      <span className="text-sm font-semibold" style={{ color: C.secondary }}>
        {label}
      </span>
      <span className={`${HEADING} text-[38px] font-semibold leading-none`}>
        {value}
        {unit && (
          <span className="ml-1 text-lg" style={{ color: C.muted }}>
            {unit}
          </span>
        )}
      </span>
      {chip && (
        <span>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </span>
      )}
      {sub && (
        <span className="text-[13px] leading-snug" style={{ color: C.muted }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border bg-white p-6 ${className}`} style={{ borderColor: C.line }}>
      {children}
    </div>
  );
}

function ExplainBox({ title, children, highlight }: { title: string; children: ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl px-[18px] py-4 ${highlight ? "" : "border bg-white"}`} style={highlight ? { background: C.soft } : { borderColor: C.line }}>
      <span className="text-xs font-bold tracking-[0.08em]" style={{ color: highlight ? C.secondary : C.muted }}>
        {title}
      </span>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * Una sección = una pregunta, un gráfico y tres recuadros: qué muestra, cómo se midió y qué se observa.
 * `wide`: los recuadros van arriba en tres columnas y el gráfico ocupa todo el ancho (tablas largas).
 */
export function ExplainedSection({
  id,
  kicker,
  question,
  muestra,
  medicion,
  observa,
  wide,
  children,
}: {
  id: string;
  kicker: string;
  question: string;
  muestra: ReactNode;
  medicion: ReactNode;
  observa: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const boxes = (
    <>
      <ExplainBox title="QUÉ MUESTRA">{muestra}</ExplainBox>
      <ExplainBox title="CÓMO SE MIDIÓ">{medicion}</ExplainBox>
      <ExplainBox title="QUÉ SE OBSERVA" highlight>
        {observa || "Todavía no hay datos suficientes para sacar conclusiones."}
      </ExplainBox>
    </>
  );
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-6 flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-bold tracking-[0.08em]" style={{ color: C.muted }}>
          {kicker}
        </span>
        <h2 id={`${id}-t`} className={`${HEADING} m-0 text-[27px] font-semibold leading-tight`}>
          {question}
        </h2>
      </div>
      {wide ? (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">{boxes}</div>
          {children}
        </>
      ) : (
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1">{children}</div>
          <div className="flex flex-col gap-3 xl:w-[360px] xl:shrink-0">{boxes}</div>
        </div>
      )}
    </section>
  );
}

export function ScaleLegend({ items, title }: { items: { fill: string; label: string; range?: string }[]; title?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {title && <span className="text-[13px] font-bold">{title}</span>}
      <div className="flex gap-1">
        {items.map((k) => (
          <div key={k.label} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="h-3 rounded" style={{ background: k.fill }} />
            <span className="text-center text-xs font-bold">{k.label}</span>
            {k.range && (
              <span className="text-center text-[11px]" style={{ color: C.muted }}>
                {k.range}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[20px] border bg-white p-6" style={{ borderColor: C.line, color: C.secondary }}>
      {children}
    </p>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 rounded-2xl px-4 py-3 text-[15px]" style={{ background: TONES.intermedio.tint, color: TONES.intermedio.ink }}>
      {children}
    </p>
  );
}
