import { NextResponse } from "next/server";
import { enregistrerSouscription, supprimerSouscription, utilisateurDepuisRequete } from "@/lib/pushServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const user = await utilisateurDepuisRequete(request);
    if (!user) return NextResponse.json({ erreur: "Session invalide ou notifications non configurées" }, { status: 401 });
    const subscription = await request.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ erreur: "Souscription Push invalide" }, { status: 400 });
    }
    await enregistrerSouscription(user.uid, subscription);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push/subscribe", error);
    return NextResponse.json({ erreur: "Impossible d'activer les notifications" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await utilisateurDepuisRequete(request);
    if (!user) return NextResponse.json({ erreur: "Session invalide" }, { status: 401 });
    const { endpoint } = await request.json();
    await supprimerSouscription(user.uid, endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erreur: "Impossible de désactiver les notifications" }, { status: 500 });
  }
}
