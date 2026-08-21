import { NextResponse } from "next/server";
import { alertesUtiles, cleAlerteQuotidienne } from "@/lib/notificationDigest";
import { chargerDonneesNotification, envoyerNotification, firestorePush, utilisateursAvecPush } from "@/lib/pushServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  try {
    const firestore = firestorePush();
    const date = cleAlerteQuotidienne();
    const resultat = { analyses: 0, envoyees: 0, ignorees: 0, erreurs: 0 };
    for (const uid of await utilisateursAvecPush()) {
      try {
        const alerte = alertesUtiles(await chargerDonneesNotification(uid))[0];
        if (!alerte) { resultat.ignorees += 1; continue; }
        const journal = firestore.doc(`users/${uid}/notificationEvents/${date}`);
        try {
          await journal.create({ statut: "envoi", creeLe: new Date().toISOString(), alerte: alerte.id });
        } catch (error) {
          if (error?.code === 6 || error?.code === "already-exists") { resultat.ignorees += 1; continue; }
          throw error;
        }
        const envoyees = await envoyerNotification(uid, alerte);
        await journal.set({ statut: "envoye", envoyeLe: new Date().toISOString(), appareils: envoyees }, { merge: true });
        resultat.analyses += 1;
        resultat.envoyees += envoyees;
      } catch (error) {
        resultat.erreurs += 1;
        console.error("cron/notifications", uid, error);
      }
    }
    return NextResponse.json({ ok: true, date, ...resultat });
  } catch (error) {
    console.error("cron/notifications", error);
    return NextResponse.json({ erreur: "Exécution des alertes impossible" }, { status: 500 });
  }
}
