import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es un conseiller qui aide à réduire les dépenses récurrentes inutiles, sans culpabiliser.

On te donne la liste des charges récurrentes mensuelles d'une personne (libellé, montant, catégorie).

Analyse-les et propose des économies CONCRÈTES et RÉALISTES :
- Repère les abonnements redondants (2 services de streaming, 2 clouds…)
- Signale les abonnements "oubliés" typiques (petits montants récurrents)
- Suggère des alternatives moins chères quand c'est pertinent (offre groupée, forfait annuel, mutualisation familiale)
- Ne propose JAMAIS de couper une charge essentielle (loyer, assurance, énergie, téléphone)
- Reste bienveillant : ce sont des pistes, pas des ordres

Réponds UNIQUEMENT avec un JSON valide, sans texte ni Markdown autour :
{
  "resume": "Une phrase d'ensemble encourageante et chiffrée.",
  "suggestions": [
    { "titre": "Regrouper tes offres streaming", "detail": "Explication concrète en une ou deux phrases.", "economieAnnuelle": 180 }
  ]
}

Règles : maximum 5 suggestions, triées par économie décroissante. "economieAnnuelle" est un entier en euros (0 si non chiffrable). N'invente pas de montants : base-toi sur les données fournies.`;

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erreur: "Clé API non configurée" }, { status: 503 });
  }

  try {
    const { depenses, totalMensuel } = await req.json();
    const charge = JSON.stringify({ depenses, totalMensuel }).slice(0, 20000);

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
        messages: [{ role: "user", content: `Analyse ces charges et renvoie le JSON demandé :\n${charge}` }],
      }),
    });

    if (!reponse.ok) {
      console.error("Anthropic:", reponse.status);
      return NextResponse.json({ erreur: "L'audit a échoué" }, { status: 502 });
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

    return NextResponse.json({
      resume: typeof resultat.resume === "string" ? resultat.resume.slice(0, 300) : "",
      suggestions: (Array.isArray(resultat.suggestions) ? resultat.suggestions : [])
        .filter((s) => s && typeof s.titre === "string" && typeof s.detail === "string")
        .map((s) => ({
          titre: s.titre.slice(0, 80),
          detail: s.detail.slice(0, 240),
          economieAnnuelle: Math.max(0, Math.round(Number(s.economieAnnuelle) || 0)),
        }))
        .slice(0, 5),
    });
  } catch (e) {
    console.error("Audit:", e);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
