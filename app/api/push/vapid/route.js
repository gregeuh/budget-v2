import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Cette route doit rester légère : le navigateur n'a besoin que de la clé
  // publique et ne doit pas charger Firebase Admin ni web-push.
  const key = process.env.PUSH_VAPID_PUBLIC_KEY || "";
  if (!key) return NextResponse.json({ erreur: "Notifications non configurées" }, { status: 503 });
  return NextResponse.json({ key }, { headers: { "Cache-Control": "no-store" } });
}
