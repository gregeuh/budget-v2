import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es un conseiller qui aide à réduire les dépenses récurrentes inutiles, avec bienveillance et sans culpabiliser.

On te donne un audit des abonnements et charges récurrentes d'une personne (libellés, montants mensuels, familles de service, doublons repérés, coût annuel).

Ta mission : donner des recommandations CONCRÈTES et personnalisées pour économiser, en respectant que certains abonnements sont légitimes.

Réponds UNIQUEMENT avec un JSON valide, sans texte autour ni Markdown :
{
  "resume": "Une phrase d'ensemble chiffrée et encourageante.",
  "recommandations": [
    {
      "titre": "Titre court et actionnable",
      "detail": "Explication en 1-2 phrases, avec le montant en jeu.",
      "economieAnnuelle": 108,
      "priorite": "haute|moyenne|basse",
      "concerne": ["Netflix", "Disney+"]
    }
  ]
}

Règles :
- Priorise par économie et facilité (doublons de streaming = cible facile)
- Sois concret : "Garde Netflix, résilie Disney+ et Prime Video que tu regardes moins" plutôt que "réduis tes abonnements"
- Ne recommande PAS de couper ce qui touche à la santé, la sécurité ou le travail sans nuance
- Maximum 5 recommandations, triées par priorité puis par économie
- economieAnnuelle : nombre entier en euros
- Reste bienveillant : ce sont des suggestions, pas des ordres`;

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erreur: "Clé API non configurée" }, { status: 503 });
  }

  try {
    const { audit } = await req.json();
    const charge = JSON.stringify(audit).slice(0, 40000);

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEME,
        messages: [{ role: "user", content: `Voici l'audit, donne tes recommandations en JSON :\n${charge}` }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Anthropic:", reponse.status, detail.slice(0, 200));
      return NextResponse.json({ erreur: "L'analyse a échoué" }, { status: 502 });
    }

    const data = await reponse.json();
    const texte = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();

    let resultat;
    try {
      resultat = JSON.parse(texte);
    } catch {
      return NextResponse.json({ erreur: "Réponse illisible" }, { status: 502 });
    }

    const recommandations = (Array.isArray(resultat.recommandations) ? resultat.recommandations : [])
      .filter((r) => r && typeof r.titre === "string" && r.titre.trim())
      .map((r) => ({
        titre: String(r.titre).slice(0, 80),
        detail: typeof r.detail === "string" ? r.detail.slice(0, 240) : "",
        economieAnnuelle: Math.max(0, Math.round(Number(r.economieAnnuelle) || 0)),
        priorite: ["haute", "moyenne", "basse"].includes(r.priorite) ? r.priorite : "moyenne",
        concerne: Array.isArray(r.concerne) ? r.concerne.slice(0, 6).map((x) => String(x).slice(0, 40)) : [],
      }))
      .slice(0, 5);

    return NextResponse.json({
      resume: typeof resultat.resume === "string" ? resultat.resume.slice(0, 300) : "",
      recommandations,
    });
  } catch (e) {
    console.error("Audit IA:", e);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
