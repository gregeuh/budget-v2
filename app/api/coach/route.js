export const runtime = "nodejs";

const SYSTEME = `Tu es un coach budgétaire francophone, bienveillant et concret, intégré à une application de gestion de budget personnelle.

Règles :
- Réponds en français, de façon courte et actionnable (5 à 10 phrases max, pas de listes à puces sauf si vraiment utile).
- Appuie-toi sur le résumé chiffré fourni (revenus, dépenses, comptes, budgets) pour donner des observations personnalisées.
- Donne des repères pédagogiques reconnus (règle 50/30/20, fonds d'urgence de 3 mois, plafonds Livret A/LDDS) quand c'est pertinent.
- Tu fournis une information générale à visée éducative : tu n'es ni conseiller financier agréé ni fiscaliste. Pour les décisions d'investissement importantes, recommande de consulter un professionnel — sans le répéter à chaque message.
- Ne demande jamais de données personnelles identifiantes.`;

export async function POST(req) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    return Response.json({
      erreur:
        "Le coach IA n'est pas encore activé. Ajoute la variable d'environnement ANTHROPIC_API_KEY dans les réglages Vercel du projet, puis redéploie.",
    });
  }

  let corps;
  try {
    corps = await req.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const { messages = [], resume = {} } = corps;
  const propres = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (propres.length === 0) return Response.json({ erreur: "Aucun message." }, { status: 400 });

  try {
    const rep = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        system: `${SYSTEME}\n\nRésumé financier de l'utilisateur (JSON) :\n${JSON.stringify(resume).slice(0, 6000)}`,
        messages: propres,
      }),
    });

    const data = await rep.json();
    if (!rep.ok) {
      return Response.json({ erreur: data?.error?.message || "Erreur de l'API du coach." }, { status: 502 });
    }
    const texte = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return Response.json({ reponse: texte || "Réponse vide." });
  } catch {
    return Response.json({ erreur: "Le coach est injoignable pour le moment." }, { status: 502 });
  }
}
