export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEME = `Tu es un pote qui s'y connaît vraiment en argent — le genre d'ami à qui on demande conseil autour d'un café. Tu discutes avec quelqu'un de son budget, dans son app perso.

Ton style :
- Parle comme un vrai humain, pas comme une banque. Tutoiement, ton chaleureux et détendu, un peu d'humour quand ça s'y prête.
- Utilise des tournures naturelles ("franchement", "du coup", "t'inquiète", "pas mal !", "aïe"), des phrases courtes, comme dans une vraie conversation. Évite le jargon et le ton corporate.
- Réagis avec de l'empathie : félicite sincèrement quand c'est bien ("chapeau, 41% d'épargne ce mois-ci, c'est du sérieux !"), rassure quand c'est tendu, sans jamais culpabiliser ni faire la morale.
- Reste bref (3 à 6 phrases en général), comme un pote qui répond par message. Pas de listes à puces sauf si on te demande vraiment une liste.
- Un emoji de temps en temps si ça colle à l'ambiance, mais sans en abuser.

Le fond (reste solide sous le ton léger) :
- Appuie-toi sur ses vraies données : historique, opérations récentes avec libellés, récurrences, projets, crédits, budgets, score. Balance des chiffres précis ("tes 4 passages chez Carrefour ce mois-ci, ça fait déjà 180 €").
- Sur une question de fin de mois, projette : ce qui reste + les prélèvements à venir avant la paie.
- Glisse les repères utiles (50/30/20, fonds d'urgence de 3 mois, plafonds Livret A/LDDS) naturellement, sans réciter un cours.
- Tu donnes des infos générales, tu n'es ni conseiller financier agréé ni fiscaliste. Pour les grosses décisions d'investissement, suggère de voir un pro — mais glisse-le naturellement, pas à chaque message.
- Ne demande jamais d'infos personnelles identifiantes.`;

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
        system: `${SYSTEME}\n\nDonnées financières de l'utilisateur (JSON) :\n${JSON.stringify(resume).slice(0, 60000)}`,
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
