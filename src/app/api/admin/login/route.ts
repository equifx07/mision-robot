import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, cookieOptions, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.password || !checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), cookieOptions());
  return res;
}
