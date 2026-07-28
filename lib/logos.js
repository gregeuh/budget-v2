/**
 * Logos de commerçants.
 *
 * On récupère le vrai logo via Clearbit (gratuit, sans clé) à partir du domaine
 * du commerçant : logo.clearbit.com/carrefour.fr → logo Carrefour.
 *
 * Deux limites assumées :
 *  - il faut deviner le domaine à partir du nom (marche pour les enseignes
 *    connues, pas pour « chez Paulo ») ;
 *  - le nom du commerçant est envoyé à un service tiers (Clearbit).
 *
 * Quand aucun logo n'est trouvé, on retombe sur une pastille à initiale.
 * L'annuaire ci-dessous corrige les cas où « nom → domaine » n'est pas évident.
 */

// Enseignes courantes (France) dont le domaine n'est pas trivial à deviner.
const ANNUAIRE = {
  carrefour: "carrefour.fr",
  "carrefour market": "carrefour.fr",
  "carrefour city": "carrefour.fr",
  leclerc: "leclerc.com",
  "e.leclerc": "leclerc.com",
  auchan: "auchan.fr",
  lidl: "lidl.fr",
  aldi: "aldi.fr",
  intermarche: "intermarche.com",
  intermarché: "intermarche.com",
  monoprix: "monoprix.fr",
  franprix: "franprix.fr",
  casino: "casino.fr",
  "super u": "magasins-u.com",
  "hyper u": "magasins-u.com",
  amazon: "amazon.fr",
  fnac: "fnac.com",
  darty: "darty.com",
  decathlon: "decathlon.fr",
  ikea: "ikea.com",
  apple: "apple.com",
  google: "google.com",
  netflix: "netflix.com",
  spotify: "spotify.com",
  "disney+": "disneyplus.com",
  deezer: "deezer.com",
  revolut: "revolut.com",
  paypal: "paypal.com",
  lcl: "lcl.fr",
  "boursorama": "boursorama.com",
  swile: "swile.co",
  uber: "uber.com",
  "uber eats": "ubereats.com",
  ubereats: "ubereats.com",
  deliveroo: "deliveroo.fr",
  "just eat": "just-eat.fr",
  mcdonalds: "mcdonalds.fr",
  "mcdonald's": "mcdonalds.fr",
  mcdo: "mcdonalds.fr",
  "burger king": "burgerking.fr",
  kfc: "kfc.fr",
  starbucks: "starbucks.fr",
  "total": "totalenergies.fr",
  totalenergies: "totalenergies.fr",
  sncf: "sncf-connect.com",
  ratp: "ratp.fr",
  edf: "edf.fr",
  engie: "engie.fr",
  orange: "orange.fr",
  sfr: "sfr.fr",
  free: "free.fr",
  bouygues: "bouygues.fr",
  zara: "zara.com",
  hm: "hm.com",
  "h&m": "hm.com",
  uniqlo: "uniqlo.com",
  sephora: "sephora.fr",
  booking: "booking.com",
  airbnb: "airbnb.fr",
};

/**
 * Devine le domaine d'un commerçant à partir de son libellé.
 * Renvoie null si on ne sait pas raisonnablement deviner (→ repli initiale).
 */
export function devinerDomaine(libelle = "") {
  const nom = libelle.trim().toLowerCase();
  if (!nom) return null;

  // 1) Annuaire exact
  if (ANNUAIRE[nom]) return ANNUAIRE[nom];

  // 2) Le libellé contient une enseigne connue (« CARREFOUR MARKET BEGLES »)
  for (const [cle, domaine] of Object.entries(ANNUAIRE)) {
    if (nom.includes(cle)) return domaine;
  }

  // 3) Un seul mot « propre » (pas d'espaces, pas de chiffres) → on tente .fr
  //    Ça attrape des enseignes non listées, sans partir sur des libellés
  //    du genre « virement 12/06 » ou « chez paulo ».
  const propre = nom.replace(/[^a-z]/g, "");
  if (/^[a-z]+$/.test(nom) && propre.length >= 4 && propre.length <= 20) {
    return `${propre}.fr`;
  }

  return null;
}

/** URL du logo Clearbit pour un domaine (taille en px). */
export function urlLogo(domaine, taille = 80) {
  if (!domaine) return null;
  return `https://logo.clearbit.com/${domaine}?size=${taille}&format=png`;
}
