/**
 * Suggestion d'icône à partir d'un libellé d'opération.
 *
 * Ce premier niveau est volontairement local : la suggestion est instantanée
 * et le libellé bancaire ne quitte pas l'appareil. Les emojis sont ceux du
 * système (donc les emojis Apple sur iPhone, iPad et Mac).
 */
const REGLES = [
  { emoji: "💇", mots: ["coiffeur", "coiffure", "barbier", "barber", "salon de beauté"] },
  { emoji: "💅", mots: ["manucure", "ongle", "nail", "esthétique", "esthetique"] },
  { emoji: "☕", mots: ["café", "cafe", "coffee", "starbucks"] },
  { emoji: "🍕", mots: ["restaurant", "resto", "brasserie", "pizza", "burger", "mcdonald", "mcdo", "kfc", "sushi"] },
  { emoji: "🛒", mots: ["courses", "carrefour", "leclerc", "auchan", "lidl", "aldi", "monoprix", "intermarché", "supermarché"] },
  { emoji: "🚕", mots: ["uber", "taxi", "bolt", "chauffeur", "vtc"] },
  { emoji: "⛽", mots: ["essence", "carburant", "station", "total", "esso", "shell"] },
  { emoji: "🚆", mots: ["sncf", "train", "ratp", "métro", "metro", "bus", "tram", "navigo"] },
  { emoji: "💊", mots: ["pharmacie", "docteur", "médecin", "medecin", "dentiste", "opticien", "kiné", "kine"] },
  { emoji: "🐶", mots: ["vétérinaire", "veterinaire", "animal", "croquette", "chien", "chat"] },
  { emoji: "🏋️", mots: ["sport", "fitness", "gym", "basic fit", "salle"] },
  { emoji: "🎬", mots: ["cinéma", "cinema", "netflix", "disney", "spotify", "concert", "théâtre", "theatre"] },
  { emoji: "👕", mots: ["vêtement", "vetement", "zara", "uniqlo", "h&m", "shopping", "mode"] },
  { emoji: "🏠", mots: ["loyer", "logement", "électricité", "electricite", "gaz", "edf", "engie"] },
  { emoji: "📱", mots: ["téléphone", "telephone", "mobile", "orange", "sfr", "bouygues", "free"] },
  { emoji: "🧾", mots: ["assurance", "mutuelle", "impôt", "impot", "facture"] },
  { emoji: "✈️", mots: ["voyage", "hôtel", "hotel", "airbnb", "booking", "avion"] },
  { emoji: "💰", mots: ["salaire", "paie", "revenu", "prime"] },
  { emoji: "🔁", mots: ["virement", "transfert", "remboursement"] },
];

export function suggererIcone(libelle = "", iconeDefaut = "📦") {
  const texte = String(libelle).toLocaleLowerCase("fr-FR");
  const regle = REGLES.find(({ mots }) => mots.some((mot) => texte.includes(mot)));
  return regle?.emoji || iconeDefaut;
}

export const ICONES_RAPIDES = [
  "💇", "💅", "☕", "🍕", "🛒", "🚕", "⛽", "🚆", "💊", "🐶",
  "🏋️", "🎬", "👕", "🏠", "📱", "🧾", "✈️", "💰", "🔁", "📦",
];

// Palette élargie, organisée pour couvrir les usages budgétaires courants.
// Le champ libre du sélecteur permet aussi d'utiliser n'importe quel emoji
// disponible sur l'appareil (Ctrl + Cmd + E sur macOS).
export const ICONES_ETENDUES = [
  "🍔", "🍣", "🥐", "🍺", "🍷", "🧋", "🛍️", "👟", "💄", "🧴",
  "🎮", "🎨", "🎵", "📚", "🎟️", "🏖️", "🗺️", "🚗", "🅿️", "🚲",
  "🛵", "🏥", "🦷", "👓", "🧘", "🏡", "🔑", "💡", "🔥", "💧",
  "📺", "💻", "☁️", "🏦", "💳", "🎁", "👶", "🎓", "📦", "🧹",
  "🪴", "🔧", "📬", "⚖️", "🐱", "🌸", "❤️", "⭐", "✅", "❓",
];
