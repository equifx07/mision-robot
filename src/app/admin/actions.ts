"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createCourse, createSchool, deleteAttempt, deleteCourse, deleteSchool, renameSchool } from "@/lib/repo";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createSchoolAction(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;
  try {
    createSchool(name);
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
  revalidatePath("/admin/colegios");
}

export async function deleteSchoolAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (id) deleteSchool(id);
  revalidatePath("/admin/colegios");
}

export async function createCourseAction(formData: FormData) {
  await guard();
  const schoolId = Number(formData.get("schoolId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!schoolId || name.length < 1) return;
  try {
    createCourse(schoolId, name);
  } catch {
    /* repetido */
  }
  revalidatePath("/admin/colegios");
}

export async function deleteCourseAction(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (id) deleteCourse(id);
  revalidatePath("/admin/colegios");
}

export async function deleteAttemptAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (id) deleteAttempt(id);
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin");
  redirect("/admin/estudiantes");
}
