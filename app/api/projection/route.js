export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es un copilote financier qui ANTICIPE la fin de mois d'une personne, à partir de ses données réelles.

On te fournit : le reste à vivre calculé, les jours avant le prochain salaire, l'historique des dépenses par mois, les récurrences à venir, les projets d'épargne (avec objectif et montant actuel), et le rythme de dépenses récent.

Ta mission : PROJETER, pas constater. Parle comme un pote qui s'y connaît : ton chaleureux et détendu, tutoiement, phrases naturelles ("franchement", "du coup", "t'inquiète"). Des prévisions chiffrées, mais dites comme un ami le dirait, pas comme un rapport de banque.

Réponds UNIQUEMENT avec un JSON valide, sans texte ni Markdown autour :
{
  "verdict": "vert" | "orange" | "rouge",
  "phrase": "Une phrase de synthèse percutante et chiffrée sur la fin de mois.",
  "finMois": { "estimation": -180, "confiance": "haute" | "moyenne" | "basse" },
  "alertes": [
    { "icone": "⚠️", "texte": "Prévision concrète et chiffrée d'un risque ou d'une échéance à venir." }
  ],
  "projets": [
    { "nom": "Vacances", "phrase": "À ce rythme, objectif atteint en novembre au lieu d'octobre." }
  ],
  "conseil": "Une action concrète et bienveillante pour finir le mois au mieux."
}

Règles STRICTES :
- "finMois.estimation" : entier en euros, positif si la personne finira dans le vert, négatif sinon. Base-toi sur : reste à vivre − dépenses probables d'ici le salaire (estimées d'après le rythme récent) + revenus à venir.
- "verdict" : "vert" si fin de mois positive confortable, "orange" si juste, "rouge" si négative probable.
- Maximum 3 alertes, les plus importantes. Maximum 3 projets.
- Chiffre TOUJOURS tes affirmations. "Tu dépenses ~35 €/jour, il reste 12 jours, soit ~420 € à prévoir."
- Sois honnête : si les données sont insuffisantes (peu d'historique), mets confiance "basse" et dis-le.
- Ton bienveillant et humain, jamais culpabilisant, un peu d'humour si ça colle. Tu es un pote, pas un juge ni un banquier.
- N'invente aucun chiffre : appuie-toi sur les données fournies.`;

export async function POST(req) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return Response.json({ erreur: "Projection IA non activée (clé API manquante)." }, { status: 503 });
  }

  try {
    const { resume, projection } = await req.json();
    const charge = JSON.stringify({ resume, projection }).slice(0, 60000);

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
        messages: [{ role: "user", content: `Analyse ces données et projette la fin de mois. Renvoie le JSON demandé :\n${charge}` }],
      }),
    });

    if (!reponse.ok) {
      console.error("Anthropic:", reponse.status);
      return Response.json({ erreur: "La projection a échoué" }, { status: 502 });
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

    // Validation
    return Response.json({
      verdict: ["vert", "orange", "rouge"].includes(r.verdict) ? r.verdict : "orange",
      phrase: typeof r.phrase === "string" ? r.phrase.slice(0, 240) : "",
      finMois: {
        estimation: Math.round(Number(r.finMois?.estimation) || 0),
        confiance: ["haute", "moyenne", "basse"].includes(r.finMois?.confiance) ? r.finMois.confiance : "moyenne",
      },
      alertes: (Array.isArray(r.alertes) ? r.alertes : [])
        .filter((a) => a && typeof a.texte === "string")
        .map((a) => ({ icone: typeof a.icone === "string" ? a.icone.slice(0, 4) : "•", texte: a.texte.slice(0, 200) }))
        .slice(0, 3),
      projets: (Array.isArray(r.projets) ? r.projets : [])
        .filter((p) => p && typeof p.nom === "string" && typeof p.phrase === "string")
        .map((p) => ({ nom: p.nom.slice(0, 40), phrase: p.phrase.slice(0, 160) }))
        .slice(0, 3),
      conseil: typeof r.conseil === "string" ? r.conseil.slice(0, 240) : "",
    });
  } catch (e) {
    console.error("Projection:", e);
    return Response.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
