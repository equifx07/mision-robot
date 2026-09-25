import { NextResponse } from "next/server";
import { listSchools } from "@/lib/repo";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ schools: listSchools() });
}
