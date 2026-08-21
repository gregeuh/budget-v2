import { NextResponse } from "next/server";
import { alertesUtiles } from "@/lib/notificationDigest";
import { chargerDonneesNotification, envoyerNotification, utilisateurDepuisRequete } from "@/lib/pushServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await utilisateurDepuisRequete(request);
    if (!user) return NextResponse.json({ erreur: "Session invalide ou notifications non configurées" }, { status: 401 });
    const alerte = alertesUtiles(await chargerDonneesNotification(user.uid))[0] || { title: "Pécule · tout est calme", body: "Aucune échéance ni budget urgent à surveiller aujourd'hui.", url: "/", tag: "pecule-apercu" };
    const envoyees = await envoyerNotification(user.uid, alerte);
    if (!envoyees) return NextResponse.json({ erreur: "Aucun iPhone n'est encore abonné." }, { status: 404 });
    return NextResponse.json({ ok: true, envoyees, alerte: { title: alerte.title } });
  } catch (error) {
    console.error("push/preview", error);
    return NextResponse.json({ erreur: "Impossible d'envoyer l'aperçu utile." }, { status: 500 });
  }
}
