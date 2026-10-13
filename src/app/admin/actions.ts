"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { parseDivisions } from "@/lib/divisions";
import { createSchool, deleteAttempt, deleteSchool, finishAttempt, lastActivity, listLive, renameSchool, restoreAttempt, restoreSchool, setAttemptDivision, setSchoolDivisions } from "@/lib/repo";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createSchoolAction(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;
  try {
    createSchool(name, parseDivisions(String(formData.get("divisions") ?? "")));
  } catch {
    /* nombre repetido */
  }
  revalidatePath("/admin/colegios");
}

export async function renameSchoolAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || name.length < 2) return;
  try {
    renameSchool(id, name);
  } catch {
    /* nombre repetido */
  }
  if (formData.has("divisions")) setSchoolDivisions(id, parseDivisions(String(formData.get("divisions") ?? "")));
  revalidatePath("/admin/colegios");
}

export async function deleteSchoolAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (id) deleteSchool(id);
  revalidatePath("/admin/colegios");
}

export async function restoreSchoolAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (id) restoreSchool(id);
  revalidatePath("/admin/papelera");
  revalidatePath("/admin/colegios");
}

export async function restoreAttemptAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) restoreAttempt(id);
  revalidatePath("/admin/papelera");
  revalidatePath("/admin/estudiantes");
}

export async function setAttemptDivisionAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const division = String(formData.get("division") ?? "").trim();
  if (id) setAttemptDivision(id, division || null);
  revalidatePath(`/admin/estudiantes/${id}`);
  revalidatePath("/admin/estudiantes");
}

/** En vivo: cierra la prueba con lo que contestó. Cuenta en los resultados (lo que falta, como no contestado). */
export async function endLiveAttemptAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const row = listLive().find((r) => r.id === id);
  if (row) finishAttempt(id, new Date(lastActivity(row)));
  revalidatePath("/admin/en-vivo");
}

/** En vivo: manda la prueba a la papelera (no cuenta en los resultados; se puede recuperar). */
export async function discardLiveAttemptAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) deleteAttempt(id);
  revalidatePath("/admin/en-vivo");
}

/** En vivo: manda a la papelera todas las pruebas sin movimiento hace más de `minutos`. */
export async function discardStaleAction(formData: FormData) {
  await guard();
  const minutes = Math.max(15, Number(formData.get("minutos")) || 60);
  const limit = Date.now() - minutes * 60000;
  for (const r of listLive()) if (lastActivity(r) < limit) deleteAttempt(r.id);
  revalidatePath("/admin/en-vivo");
}

export async function deleteAttemptAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) deleteAttempt(id);
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin");
  redirect("/admin/estudiantes");
}
