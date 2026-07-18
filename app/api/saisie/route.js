export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu interprètes une phrase en français décrivant une dépense ou un revenu, et tu la convertis en opération bancaire structurée.

On te donne : la phrase, la liste des catégories disponibles, la liste des comptes, et la date du jour.

Réponds UNIQUEMENT avec un JSON valide, sans texte ni Markdown autour :
{
  "montant": 15.15,
  "type": "depense" | "revenu",
  "libelle": "Carrefour",
  "categorie": "courses",
  "date": "2026-07-18",
  "compte": "Compte courant",
  "lieu": null,
  "confiance": 0.9,
  "note": "Si un élément manque ou est ambigu, dis-le en une phrase courte. Sinon chaîne vide."
}

Règles STRICTES :
- "montant" : nombre POSITIF (le sens est porté par "type"). Si aucun montant n'est identifiable, mets 0.
- "type" : "depense" par défaut. "revenu" si la phrase indique une entrée d'argent (salaire, remboursement, virement reçu, vente...).
- "libelle" : le nom du commerçant ou l'objet de la dépense, propre et court ("Carrefour", "Restaurant", "Salaire"). Jamais la phrase entière.
- "categorie" : OBLIGATOIREMENT une clé exacte de la liste "categories" fournie. Choisis la plus pertinente.
- "date" : au format YYYY-MM-DD. Interprète les expressions relatives par rapport à la date du jour fournie ("hier", "avant-hier", "lundi dernier", "le 12"). Par défaut : la date du jour.
- "compte" : le nom EXACT d'un compte de la liste si la phrase en mentionne un ("sur Revolut", "avec la carte Swile"). Sinon null.
- "lieu" : uniquement si un lieu précis est mentionné ("à Bordeaux", "au Central Pub"). Sinon null.
- "confiance" : entre 0 et 1. Basse si le montant ou la nature est incertain.
- N'invente rien : si la phrase est trop vague, mets montant 0 et explique dans "note".`;

export async function POST(req) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return Response.json({ erreur: "Saisie intelligente non activée (clé API manquante)." }, { status: 503 });
  }

  try {
    const { phrase, categories, comptes, dateDuJour } = await req.json();
    if (!phrase || typeof phrase !== "string" || !phrase.trim()) {
      return Response.json({ erreur: "Phrase vide." }, { status: 400 });
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
        max_tokens: 600,
        system: SYSTEME,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              phrase: phrase.slice(0, 300),
              categories,
              comptes,
              dateDuJour,
            }),
          },
        ],
      }),
    });

    if (!reponse.ok) {
      console.error("Anthropic:", reponse.status);
      return Response.json({ erreur: "L'interprétation a échoué" }, { status: 502 });
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

    // Validation stricte
    const montant = Math.abs(Number(r.montant) || 0);
    const categorieOk = categories && Object.prototype.hasOwnProperty.call(categories, r.categorie);
    const dateOk = typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date);

    return Response.json({
      montant: Math.round(montant * 100) / 100,
      type: r.type === "revenu" ? "revenu" : "depense",
      libelle: typeof r.libelle === "string" ? r.libelle.slice(0, 40) : "",
      categorie: categorieOk ? r.categorie : "autre",
      date: dateOk ? r.date : dateDuJour,
      compte: typeof r.compte === "string" ? r.compte.slice(0, 40) : null,
      lieu: typeof r.lieu === "string" && r.lieu.trim() ? r.lieu.slice(0, 60) : null,
      confiance: Math.min(1, Math.max(0, Number(r.confiance) || 0.5)),
      note: typeof r.note === "string" ? r.note.slice(0, 160) : "",
    });
  } catch (e) {
    console.error("Saisie:", e);
    return Response.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
