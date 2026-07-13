import { TYPES_COMPTE, prochaineDateSalaire, aujourdhui, isoLocal } from "./format";

// Message d'accueil : le contexte prioritaire d'abord, sinon une phrase
// selon le moment de la journée (variante stable pour la journée).
export function messageAccueil({ comptes, soldes, profil, transactions }) {
  const maintenant = new Date();
  const heure = maintenant.getHours();
  const jourSemaine = maintenant.getDay(); // 0 = dimanche
  const jourDuMois = maintenant.getDate();

  // Salutation selon le créneau
  const salutation =
    heure < 5 ? { mot: "Bonsoir", emoji: "🦉" } :
    heure < 11 ? { mot: "Bonjour", emoji: "🌅" } :
    heure < 18 ? { mot: "Bonjour", emoji: "☀️" } :
    heure < 23 ? { mot: "Bonsoir", emoji: "🌙" } :
    { mot: "Bonsoir", emoji: "🦉" };

  // ---- Contextes prioritaires ----
  const salaireISO = prochaineDateSalaire(profil.jourSalaire);
  if (salaireISO) {
    const dans = Math.round((new Date(salaireISO) - maintenant) / 86400000);
    if ((profil.jourSalaire || 0) === jourDuMois) return { ...salutation, phrase: "Jour de paie ! 🎉" };
    if (dans === 1) return { ...salutation, phrase: "Le salaire arrive demain 💼" };
  }

  const courantsNegatifs = comptes.some(
    (c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe === "courant" && (soldes[c.id] || 0) < 0
  );
  if (courantsNegatifs) return { ...salutation, phrase: "Un compte est dans le rouge 👀" };

  const semaine = isoLocal(new Date(Date.now() - 7 * 86400000));
  const activiteRecente = transactions.some((t) => t.date >= semaine);
  if (transactions.length > 0 && !activiteRecente) {
    return { ...salutation, phrase: "Pense à saisir tes dernières dépenses ✍️" };
  }

  if (jourDuMois === 1) return { ...salutation, phrase: "Nouveau mois, compteurs remis à zéro ✨" };

  // ---- Phrases selon le moment (variante stable par jour) ----
  const weekend = jourSemaine === 0 || jourSemaine === 6;
  const aSwile = comptes.some((c) => c.type === "swile" && (soldes[c.id] || 0) > 10);

  let pool;
  if (heure < 5 || heure >= 23) pool = ["Encore debout ? 🦉", "Les comptes ne dorment jamais 😄"];
  else if (heure < 11) pool = weekend
    ? ["Bon week-end ! 🛋️", "Grasse matinée méritée ?"]
    : ["Prêt à attaquer la journée ?", "Un café et c'est parti ☕"];
  else if (heure < 14) pool = aSwile
    ? ["Bon appétit — les titres-resto t'attendent 🍽️", "C'est l'heure de déjeuner 🍕"]
    : ["Bon appétit ! 🍽️", "Pause déjeuner bien méritée"];
  else if (heure < 18) pool = weekend
    ? ["Profite bien de ton week-end ⚽", "Après-midi tranquille ?"]
    : ["La journée se passe bien ?", "Petit point comptes de l'après-midi 📊"];
  else pool = weekend
    ? ["Bonne soirée ! 🌆", "Le week-end file vite, non ?"]
    : ["Belle soirée à toi 🌆", "On fait les comptes du jour ?"];

  return { ...salutation, phrase: pool[jourDuMois % pool.length] };
}
