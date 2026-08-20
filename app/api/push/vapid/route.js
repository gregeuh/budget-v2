import { NextResponse } from "next/server";
import { clePushPublique } from "@/lib/pushServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = clePushPublique();
  if (!key) return NextResponse.json({ erreur: "Notifications non configurées" }, { status: 503 });
  return NextResponse.json({ key }, { headers: { "Cache-Control": "no-store" } });
}
