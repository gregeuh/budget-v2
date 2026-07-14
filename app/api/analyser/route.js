import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es un analyste financier qui identifie les charges et revenus RÉCURRENTS dans un historique bancaire français.

On te donne :
- "candidats" : des récurrences déjà détectées par des règles (fiables, mais aux libellés bruts)
- "operations" : l'historique brut, où d'autres récurrences peuvent se cacher

Ta mission :
1. Nettoie le libellé de chaque candidat en un nom lisible ("PRLV SEPA ORANGE SA 4472891" -> "Orange")
2. Ajoute les récurrences que les règles ont ratées (montant variable, libellé changeant, quinzaine, trimestre)
3. Écarte les faux positifs (courses fréquentes chez le même commerçant N'EST PAS une récurrence)

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans balises Markdown :
{
  "recurrences": [
    {
      "libelle": "Orange",
      "montant": -29.99,
      "jour": 5,
      "categorie": "abonnements",
      "type": "charge",
      "variable": false,
      "confiance": 0.95,
      "note": "Prélevé le 5 depuis 3 mois"
    }
  ],
  "observation": "Une phrase utile sur l'ensemble (doublons, poste inhabituel, économie possible)."
}

Règles STRICTES :
- "montant" : négatif pour une charge, positif pour un revenu
- "jour" : entier entre 1 et 28
- "categorie" : uniquement une clé de la liste "categoriesDisponibles" fournie
- "type" : "charge" ou "revenu"
- "confiance" : entre 0 et 1
- Maximum 12 récurrences, triées par montant absolu décroissant
- N'invente RIEN : chaque récurrence doit s'appuyer sur des opérations réelles fournies`;

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erreur: "Clé API non configurée" }, { status: 503 });
  }

  try {
    const { candidats, operations, categoriesDisponibles } = await req.json();

    const charge = JSON.stringify({ candidats, operations, categoriesDisponibles }).slice(0, 60000);

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: SYSTEME,
        messages: [{ role: "user", content: `Analyse ces données et renvoie le JSON demandé :\n${charge}` }],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error("Anthropic:", reponse.status, detail.slice(0, 300));
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
      console.error("Réponse non JSON:", texte.slice(0, 200));
      return NextResponse.json({ erreur: "Réponse illisible" }, { status: 502 });
    }

    // Validation stricte avant de renvoyer au client
    const valides = (Array.isArray(resultat.recurrences) ? resultat.recurrences : [])
      .filter(
        (r) =>
          r &&
          typeof r.libelle === "string" &&
          r.libelle.trim() &&
          Number.isFinite(Number(r.montant)) &&
          Math.abs(Number(r.montant)) > 0 &&
          categoriesDisponibles?.[r.categorie]
      )
      .map((r) => ({
        libelle: String(r.libelle).slice(0, 40),
        montant: Math.round(Number(r.montant) * 100) / 100,
        jour: Math.min(28, Math.max(1, Math.round(Number(r.jour) || 1))),
        categorie: r.categorie,
        type: Number(r.montant) > 0 ? "revenu" : "charge",
        variable: Boolean(r.variable),
        confiance: Math.min(1, Math.max(0, Number(r.confiance) || 0.5)),
        note: typeof r.note === "string" ? r.note.slice(0, 120) : "",
      }))
      .slice(0, 12);

    return NextResponse.json({
      recurrences: valides,
      observation: typeof resultat.observation === "string" ? resultat.observation.slice(0, 300) : "",
    });
  } catch (e) {
    console.error("Analyse:", e);
    return NextResponse.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
