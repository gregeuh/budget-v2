import { NextResponse } from "next/server";
import { envoyerNotification, utilisateurDepuisRequete } from "@/lib/pushServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const user = await utilisateurDepuisRequete(request);
    if (!user) return NextResponse.json({ erreur: "Session invalide ou notifications non configurées" }, { status: 401 });
    const envoyees = await envoyerNotification(user.uid, {
      title: "Pécule fonctionne en arrière-plan",
      body: "Ceci est une vraie notification envoyée à ton iPhone.",
      url: "/inbox",
      tag: "pecule-test",
    });
    if (!envoyees) return NextResponse.json({ erreur: "Aucun iPhone n'est encore abonné." }, { status: 404 });
    return NextResponse.json({ ok: true, envoyees });
  } catch (error) {
    console.error("push/test", error);
    return NextResponse.json({ erreur: "Envoi impossible. Vérifie les clés Web Push." }, { status: 500 });
  }
}
