"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Course = { id: number; name: string };
type School = { id: number; name: string; courses: Course[] };

export const ATTEMPT_KEY = "mr_attempt";

function detectDevice(): string {
  if (typeof navigator === "undefined") return "desconocido";
  const ua = navigator.userAgent;
  const touch = navigator.maxTouchPoints > 0;
  const w = window.screen.width;
  if (/CrOS/.test(ua)) return "chromebook";
  if (/iPad|Android(?!.*Mobile)/.test(ua) || (touch && w < 1100 && w >= 600)) return "tablet";
  if (/iPhone|Android.*Mobile/.test(ua) || w < 600) return "celular";
  return "computadora";
}

export function StartForm() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState<number | "">("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [age, setAge] = useState<string>("");
  const [priorExp, setPriorExp] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resume, setResume] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => setSchools(d.schools ?? []))
      .catch(() => setSchools([]));
    try {
      const id = localStorage.getItem(ATTEMPT_KEY);
      if (id) {
        fetch(`/api/attempts/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.status === "in_progress") setResume({ id, name: d.studentName });
            else localStorage.removeItem(ATTEMPT_KEY);
          })
          .catch(() => {});
      }
    } catch {
      /* sin localStorage */
    }
  }, []);

  const courses = schools?.find((s) => s.id === schoolId)?.courses ?? [];

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Escribí tu nombre y apellido.");
    if (schoolId === "" || courseId === "") return setError("Elegí tu colegio y tu curso.");
    if (!priorExp) return setError("Contanos si tuviste clases de programación antes.");
    setSending(true);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentName: name.trim(),
          schoolId,
          courseId,
          age: age || null,
          priorExp,
          gender: gender || null,
          device: detectDevice(),
          screen: `${window.screen.width}x${window.screen.height}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo empezar");
      try {
        localStorage.setItem(ATTEMPT_KEY, data.attemptId);
      } catch {
        /* sin localStorage */
      }
      router.push(`/prueba?a=${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo empezar. Probá de nuevo.");
      setSending(false);
    }
  }

  const field = "w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none";
  const label = "mb-1 block text-sm font-semibold text-slate-700";

  return (
    <div className="mx-auto w-full max-w-lg">
      {resume && (
        <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Hay una prueba empezada por {resume.name}.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => router.push(`/prueba?a=${resume.id}`)} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600">
              Continuar esa prueba
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(ATTEMPT_KEY);
                setResume(null);
              }}
              className="rounded-xl px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
            >
              Soy otra persona
            </button>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200">
        <div>
          <label className={label} htmlFor="name">
            Nombre y apellido
          </label>
          <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={80} placeholder="Ej.: Ana Pérez" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="school">
              Colegio
            </label>
            <select
              id="school"
              className={field}
              value={schoolId}
              onChange={(e) => {
                setSchoolId(e.target.value ? Number(e.target.value) : "");
                setCourseId("");
              }}
            >
              <option value="">Elegí tu colegio</option>
              {(schools ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="course">
              Curso
            </label>
            <select id="course" className={field} value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")} disabled={schoolId === ""}>
              <option value="">Elegí tu curso</option>
              {courses.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {schools && schools.length === 0 && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Todavía no hay colegios cargados. Hay que cargarlos desde el panel de administración.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="age">
              Edad
            </label>
            <select id="age" className={field} value={age} onChange={(e) => setAge(e.target.value)}>
              <option value="">Elegí tu edad</option>
              {[10, 11, 12, 13, 14].map((a) => (
                <option key={a} value={a}>
                  {a} años
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="gender">
              Género (opcional)
            </label>
            <select id="gender" className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefiero no decir</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <fieldset>
          <legend className={label}>¿Tuviste clases de programación o robótica antes?</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {[
              ["nunca", "Nunca"],
              ["algunas", "Algunas veces"],
              ["siempre", "Sí, todos los años"],
            ].map(([v, t]) => (
              <label
                key={v}
                className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium ${
                  priorExp === v ? "border-blue-500 bg-blue-50" : "border-slate-300"
                }`}
              >
                <input type="radio" name="prior" value={v} checked={priorExp === v} onChange={() => setPriorExp(v)} />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" disabled={sending || !schools || schools.length === 0} className="rounded-2xl bg-[#176CE0] shadow-[inset_0_-4px_0_#0D55BF] hover:bg-[#1561C9] px-5 py-3 text-lg font-semibold text-white disabled:opacity-50">
          {sending ? "Empezando…" : "Empezar"}
        </button>
      </form>
    </div>
  );
}
