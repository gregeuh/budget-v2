import { devinerDepuisHistorique } from "./habitudes";

// Règles de reconnaissance par enseigne / mot-clé.
// Enrichies avec les commerçants réellement présents sur les relevés.
export const REGLES_CAT = [
  ["courses", /carrefour|leclerc|lidl|aldi|auchan|intermarche|monoprix|monop|franprix|casino|grand frais|picard|biocoop|saines saveurs|pains etc|boulangerie|paul\b/i],
  ["resto", /mcdo|mc\s?donald|burger|kfc|uber\s*eats|deliveroo|resto|restaurant|pizz|sushi|kebab|brasserie|bistro|starbucks|estanquet|fran'?s verdu|la cave|sumup|la bocca|central pub|liegeoise|st martin|marco polo|planet panda|jt village|newrest/i],
  ["transport", /sncf|ratp|navigo|tbm|total|esso|bp\s|shell|autoroute|vinci|sanef|asf\b|atlandes|bidegi|uber(?!\s*eats)|blablacar|parking|metpar|europcar|estacion de serv|garaje|relais aquitaine/i],
  ["abonnements", /netflix|spotify|disney|canal\+?|prime video|amazon prime|deezer|apple\.com|icloud|youtube|psn|playstation|xbox|basic.?fit|onair|spliiit|chatgpt|adobe|microsoft/i],
  ["factures", /edf|engie|totalenergies|veolia|regie eau|gaz de bordeaux|free\s|orange|sfr|bouygues|sosh|red by|assurance|mutuelle|maif|maaf|matmut|axa|mae\b|spb\b|lac air|tenue de compte|drfip|interets debiteurs/i],
  ["logement", /loyer|foncia|nexity|century|orpi|syndic|dieu s\.a\.s|leroy merlin|ikea/i],
  ["sante", /pharmacie|docteur|dr\s|medecin|dentiste|labo|hopital|clinique|kassab|aroma-?zone|horace/i],
  ["animaux", /veterinaire|veto|maxi\s*zoo|animalis|croquette/i],
  ["shopping", /amazon|fnac|darty|zalando|vinted|nike|adidas|decathlon|zara|h&m|boulanger|cdiscount|snipes|citadium|louis pion|eyeswatch|sagasport|espace foot|fanatics|withings|samsung|apple store|arte antwerp/i],
  ["loisirs", /cinema|ugc|pathe|gaumont|steam|nintendo|billetterie|concert|stade|psg|real sociedad|five|urban|leetchi/i],
  ["voyages", /airbnb|booking|klarna\*airbnb|hotel|camping|ryanair|easyjet|air france/i],
  ["epargne", /livret\s?a|ldds|pel\b|assurance vie|option system'? epargne/i],
  ["salaire", /salaire|everping|remuneration|vir(ement)?\s+.*(paie|salaire)/i],
  ["autresRevenus", /c\.p\.a\.m|cpam|caf\b|pole emploi|remboursement|alan insurance/i],
];

/**
 * Devine une catégorie à partir des seules règles (libellé + sens du montant).
 */
export function devinerCategorie(libelle = "", montant = 0) {
  for (const [cat, re] of REGLES_CAT) if (re.test(libelle)) return cat;
  return montant > 0 ? "autresRevenus" : "autre";
}

/**
 * Devine une catégorie en combinant l'apprentissage et les règles.
 * L'historique personnel prime : si tu as déjà rangé ce commerçant quelque part,
 * c'est ce choix qui est repris. Sinon on retombe sur les règles génériques.
 * Retourne { categorie, source } ou null si rien de fiable.
 */
export function devinerCategorieComplet(libelle = "", montant = 0, memoire = null, libelleBanque = "") {
  const sources = [libelle, libelleBanque].filter(Boolean);

  // 1. Ton historique d'abord (le plus fiable : ce sont tes propres choix)
  if (memoire) {
    for (const s of sources) {
      const appris = devinerDepuisHistorique(s, memoire);
      if (appris?.categorie && appris.categorie !== "autre" && appris.categorie !== "autresRevenus") {
        return { categorie: appris.categorie, source: "habitude", occurrences: appris.occurrences };
      }
    }
  }

  // 2. Règles génériques, testées sur le libellé propre puis sur celui de la banque
  for (const s of sources) {
    for (const [cat, re] of REGLES_CAT) {
      if (re.test(s)) return { categorie: cat, source: "regle" };
    }
  }

  return null;
}
