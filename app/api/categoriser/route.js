export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu ranges des opérations bancaires françaises dans les bonnes catégories de budget.

On te donne une liste d'opérations (nom du commerçant tel qu'il apparaît sur le relevé, et montant : négatif pour une dépense, positif pour une entrée d'argent), ainsi que la liste des catégories disponibles.

Réponds UNIQUEMENT avec un JSON valide, sans texte ni Markdown autour :
{
  "resultats": [
    { "nom": "SQ *FRAN'S VERDU", "categorie": "resto", "confiance": 0.9 }
  ]
}

Règles STRICTES :
- "categorie" doit être une CLÉ EXACTE de la liste "categories" fournie. Jamais un libellé, jamais une clé inventée.
- Reprends le "nom" EXACTEMENT tel qu'il t'a été donné, sans le modifier.
- Un montant positif est une entrée d'argent : choisis une catégorie de revenu.
- "confiance" entre 0 et 1. Si tu n'es pas sûr, mets une valeur basse plutôt que d'inventer.
- Si un nom est vraiment trop obscur pour être rangé avec un minimum de certitude, mets "categorie": "autre" et une confiance basse.
- Tu connais les enseignes françaises : sers-t'en (péages, banques, assurances, enseignes régionales, applications).
- Réponds pour CHAQUE opération de la liste, dans le même ordre.`;

export async function POST(req) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return Response.json({ erreur: "Rangement IA non activé (clé API manquante)." }, { status: 503 });
  }

  try {
    const { operations, categories } = await req.json();
    if (!Array.isArray(operations) || operations.length === 0) {
      return Response.json({ erreur: "Rien à ranger." }, { status: 400 });
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
        max_tokens: 2000,
        system: SYSTEME,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              operations: operations.slice(0, 60),
              categories,
            }),
          },
        ],
      }),
    });

    if (!reponse.ok) {
      console.error("Anthropic:", reponse.status);
      return Response.json({ erreur: "Le rangement a échoué" }, { status: 502 });
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

    const valides = (Array.isArray(r.resultats) ? r.resultats : [])
      .filter(
        (x) =>
          x &&
          typeof x.nom === "string" &&
          typeof x.categorie === "string" &&
          Object.prototype.hasOwnProperty.call(categories || {}, x.categorie)
      )
      .map((x) => ({
        nom: x.nom.slice(0, 80),
        categorie: x.categorie,
        confiance: Math.min(1, Math.max(0, Number(x.confiance) || 0.5)),
      }));

    return Response.json({ resultats: valides });
  } catch (e) {
    console.error("Categoriser:", e);
    return Response.json({ erreur: "Erreur serveur" }, { status: 500 });
  }
}
