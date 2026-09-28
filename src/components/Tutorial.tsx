"use client";

// Pantallas de explicación y de práctica (las usa TestRunner y la vista previa del tutorial).

import { BlockChip } from "@/components/ProgramView";
import { RobotRunner } from "@/components/RobotRunner";
import { TryIt } from "@/components/TryIt";
import { LEGEND, type Practice, type TutorialStep } from "@/lib/tutorial";

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="max-w-3xl list-disc space-y-1 pl-6 text-lg text-slate-700">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

export function IntroStepContent({ step, stepKey }: { step: TutorialStep; stepKey: string }) {
  return (
    <>
      <h2 className="max-w-3xl text-2xl font-black text-slate-800">{step.title}</h2>
      <Lines lines={step.lines} />
      {step.demo && <RobotRunner key={stepKey} map={step.demo.map} program={step.demo.program} outcome={step.demo.outcome} />}
      {step.tryIt && <TryIt key={step.tryIt.id} item={step.tryIt} />}
      {step.legend && (
        <div className="grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2">
          {LEGEND.map((l) => (
            <div key={l.title} className="flex items-center gap-3 rounded-xl bg-white px-3 pb-3 pt-2.5 ring-2 ring-[#EDE3CC]">
              <BlockChip fam={l.fam} size="compact">
                {l.title}
              </BlockChip>
              <span className="text-sm text-slate-700">{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function PracticeContent({ practice, practiceKey }: { practice: Practice; practiceKey: string }) {
  return (
    <>
      <div className="text-sm font-semibold uppercase tracking-wide text-amber-600">Práctica · no cuenta para el resultado</div>
      <h2 className="max-w-3xl text-2xl font-black text-slate-800">{practice.title}</h2>
      <Lines lines={practice.lines} />
      {practice.demos.map((d, i) => (
        <RobotRunner key={`${practiceKey}-${i}`} map={d.map} program={d.program} outcome={d.outcome} />
      ))}
      {practice.tries?.map((t) => <TryIt key={t.id} item={t} />)}
    </>
  );
}
