export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es le conseiller budgétaire personnel de l'utilisateur d'une app française.

On te donne un résumé complet et RÉEL de sa situation : ses comptes, 6 mois d'historique, ses opérations récentes, ses charges récurrentes, ses budgets, ses crédits et projets. Tout est en euros.

Ta mission : produire 3 à 5 conseils COURTS, CONCRETS et PERSONNELS, fondés sur ses vrais chiffres. Pas de généralités qu'on pourrait dire à n'importe qui.

Réponds UNIQUEMENT avec un JSON valide, sans texte ni Markdown autour :
{
  "conseils": [
    { "ton": "bravo", "icone": "🎯", "titre": "Titre court", "texte": "1 à 2 phrases avec un chiffre précis tiré de ses données." }
  ]
}

Règles STRICTES :
- "ton" vaut exactement "bravo" (félicitation), "info" (observation utile) ou "alerte" (point de vigilance).
- "icone" : un seul emoji pertinent.
- "titre" : 5 mots maximum.
- "texte" : 2 phrases maximum, avec au moins un CHIFFRE réel tiré des données (un montant, un pourcentage, un nom de commerçant, une catégorie). C'est ce qui rend le conseil personnel.
- Tutoie l'utilisateur, ton amical de pote qui s'y connaît, jamais moralisateur ni culpabilisant.
- Base-toi sur des TENDANCES (comparaison entre mois), des postes précis, des habitudes réelles visibles dans les données. Repère ce qui a changé, ce qui dérive, ce qui va bien.
- Si un mois est manifestement incomplet (le mois en cours), n'en tire pas de conclusion hâtive.
- Varie les angles : épargne, un poste précis, un abonnement, une bonne nouvelle. Ne répète pas le même sujet.
- Ne donne JAMAIS de conseil d'investissement précis (quel placement, quelle action). Reste sur la gestion du budget.
- Si les données sont trop maigres pour un vrai conseil, renvoie moins de conseils plutôt que d'inventer.

Réponds en français.`;

export async function POST(req) {
  const securite = await protegerRoute(req, { scope: "ia", limit: 12 });
  if (securite.response) return securite.response;
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return Response.json({ erreur: "Conseils IA non activés (clé API manquante)." }, { status: 503 });
  }

  try {
    const { resume } = await req.json();
    if (!resume) {
      return Response.json({ erreur: "Rien à analyser." }, { status: 400 });
    }

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEME,
        messages: [{ role: "user", content: JSON.stringify(resume) }],
      }),
    });

    if (!reponse.ok) {
      console.error("Anthropic:", reponse.status);
      return Response.json({ erreur: "L'analyse a échoué" }, { status: 502 });
    }

    const data = await reponse.json();
    const texte = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();

    let r;
    try {
      r = JSON.parse(texte);
    } catch {
      return Response.json({ erreur: "Réponse illisible" }, { status: 502 });
    }

    const TONS = ["bravo", "info", "alerte"];
    const conseils = (Array.isArray(r.conseils) ? r.conseils : [])
      .filter((c) => c && typeof c.titre === "string" && typeof c.texte === "string")
      .slice(0, 5)
      .map((c) => ({
        ton: TONS.includes(c.ton) ? c.ton : "info",
        icone: (typeof c.icone === "string" && c.icone.slice(0, 4)) || "💡",
        titre: c.titre.slice(0, 60),
        texte: c.texte.slice(0, 240),
        parIA: true,
      }));

    return Response.json({ conseils });
  } catch (e) {
    console.error("Conseils:", e);
    return Response.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
import { protegerRoute } from "@/lib/api-security.server";
