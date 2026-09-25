// Autenticación del único usuario administrador.
// ADMIN_PASSWORD: contraseña (obligatoria en producción). ADMIN_SECRET: clave para firmar la sesión (opcional).
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "mr_admin";
const SESSION_HOURS = 12;

function password(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (p && p.length >= 4) return p;
  if (process.env.NODE_ENV === "production") throw new Error("Falta ADMIN_PASSWORD");
  return "admin1234"; // solo desarrollo
}

function secret(): string {
  return process.env.ADMIN_SECRET || `mision-robot::${password()}`;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function checkPassword(candidate: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(password());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Para páginas del panel: redirige al login si no hay sesión. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  };
}
