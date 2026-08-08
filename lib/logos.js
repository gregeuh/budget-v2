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
  "carrefour contact": "carrefour.fr",
  "carrefour drive": "carrefour.fr",
  leclerc: "leclerc.com",
  "e.leclerc": "leclerc.com",
  auchan: "auchan.fr",
  lidl: "lidl.fr",
  aldi: "aldi.fr",
  intermarche: "intermarche.com",
  intermarché: "intermarche.com",
  monoprix: "monoprix.fr",
  franprix: "franprix.fr",
  picard: "picard.fr",
  biocoop: "biocoop.fr",
  "grand frais": "grandfrais.com",
  casino: "casino.fr",
  "super u": "magasins-u.com",
  "hyper u": "magasins-u.com",
  amazon: "amazon.fr",
  "amazon eu": "amazon.fr",
  "amazon marketplace": "amazon.fr",
  vinted: "vinted.fr",
  "le bon coin": "leboncoin.fr",
  leboncoin: "leboncoin.fr",
  "back market": "backmarket.fr",
  temu: "temu.com",
  shein: "shein.com",
  fnac: "fnac.com",
  darty: "darty.com",
  boulanger: "boulanger.com",
  "electro depot": "electrodepot.fr",
  decathlon: "decathlon.fr",
  ikea: "ikea.com",
  apple: "apple.com",
  itunes: "apple.com",
  "apple com bill": "apple.com",
  google: "google.com",
  "google play": "play.google.com",
  "google one": "one.google.com",
  netflix: "netflix.com",
  spotify: "spotify.com",
  "disney+": "disneyplus.com",
  deezer: "deezer.com",
  revolut: "revolut.com",
  paypal: "paypal.com",
  paylib: "paylib.fr",
  lcl: "lcl.fr",
  "boursorama": "boursorama.com",
  swile: "swile.co",
  uber: "uber.com",
  "uber trip": "uber.com",
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
  "sushi shop": "sushishop.fr",
  "total": "totalenergies.fr",
  totalenergies: "totalenergies.fr",
  sncf: "sncf-connect.com",
  ratp: "ratp.fr",
  edf: "edf.fr",
  engie: "engie.fr",
  orange: "orange.fr",
  "orange mobile": "orange.fr",
  sfr: "sfr.fr",
  free: "free.fr",
  bouygues: "bouygues.fr",
  zara: "zara.com",
  hm: "hm.com",
  "h&m": "hm.com",
  uniqlo: "uniqlo.com",
  sephora: "sephora.fr",
  "yves rocher": "yves-rocher.fr",
  booking: "booking.com",
  airbnb: "airbnb.fr",
  // Banques / paiement
  "societe generale": "societegenerale.fr",
  "société générale": "societegenerale.fr",
  "banque postale": "labanquepostale.fr",
  "credit agricole": "credit-agricole.fr",
  "crédit agricole": "credit-agricole.fr",
  "credit mutuel": "creditmutuel.fr",
  "crédit mutuel": "creditmutuel.fr",
  bnp: "bnpparibas.fr",
  "bnp paribas": "bnpparibas.fr",
  hsbc: "hsbc.fr",
  n26: "n26.com",
  lydia: "lydia-app.com",
  klarna: "klarna.com",
  // Santé / assurance
  maif: "maif.fr",
  macif: "macif.fr",
  maaf: "maaf.fr",
  axa: "axa.fr",
  allianz: "allianz.fr",
  matmut: "matmut.fr",
  "harmonie mutuelle": "harmonie-mutuelle.fr",
  doctolib: "doctolib.fr",
  // Restauration / livraison
  "domino's": "dominos.fr",
  dominos: "dominos.fr",
  "pizza hut": "pizzahut.fr",
  subway: "subway.com",
  quick: "quick.fr",
  "o'tacos": "otacos.com",
  "brioche doree": "briochedoree.fr",
  "brioche dorée": "briochedoree.fr",
  paul: "paul.fr",
  // Loisirs / streaming / jeux
  "canal+": "canalplus.com",
  canalplus: "canalplus.com",
  "prime video": "primevideo.com",
  "playstation": "playstation.com",
  psn: "playstation.com",
  xbox: "xbox.com",
  steam: "steampowered.com",
  "nintendo": "nintendo.fr",
  twitch: "twitch.tv",
  youtube: "youtube.com",
  "youtube premium": "youtube.com",
  cultura: "cultura.com",
  micromania: "micromania.fr",
  // Transport / mobilité
  blablacar: "blablacar.fr",
  "total energies": "totalenergies.fr",
  esso: "esso.fr",
  bp: "bp.com",
  vinci: "vinci-autoroutes.com",
  flixbus: "flixbus.fr",
  trainline: "thetrainline.com",
  // Mode / maison / bricolage
  celio: "celio.com",
  kiabi: "kiabi.com",
  jules: "jules.com",
  "la redoute": "laredoute.fr",
  cdiscount: "cdiscount.com",
  leroymerlin: "leroymerlin.fr",
  "leroy merlin": "leroymerlin.fr",
  castorama: "castorama.fr",
  but: "but.fr",
  conforama: "conforama.fr",
  maisonsdumonde: "maisonsdumonde.com",
  "maisons du monde": "maisonsdumonde.com",
  // Beauté / bien-être
  nocibe: "nocibe.fr",
  "marionnaud": "marionnaud.fr",
  "basic fit": "basic-fit.com",
  "basicfit": "basic-fit.com",
  "fitness park": "fitnesspark.fr",
  "la poste": "laposte.fr",
  chronopost: "chronopost.fr",
};

// Les libellés bancaires contiennent souvent des préfixes, accents et
// ponctuation (« CB CARREFOUR CITY 0182 », « PRLV SEPA NETFLIX.COM »). Une
// forme commune permet de retrouver l'enseigne quel que soit le format reçu.
export function normaliserLibelleCommercant(libelle = "") {
  return String(libelle)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const ANNUAIRE_NORMALISE = Object.entries(ANNUAIRE)
  .map(([cle, domaine]) => [normaliserLibelleCommercant(cle), domaine])
  .sort(([a], [b]) => b.length - a.length);

/**
 * Devine le domaine d'un commerçant à partir de son libellé.
 * Renvoie null si on ne sait pas raisonnablement deviner (→ repli initiale).
 */
export function devinerDomaine(libelle = "") {
  const nom = normaliserLibelleCommercant(libelle);
  if (!nom) return null;

  // 1) Annuaire exact
  const exact = ANNUAIRE_NORMALISE.find(([cle]) => cle === nom);
  if (exact) return exact[1];

  // 2) Le libellé contient une enseigne connue (« CB CARREFOUR MARKET
  // BEGLES »). Les frontières sur les espaces normalisés évitent que « chez
  // paulo » soit pris pour la boulangerie Paul.
  for (const [cle, domaine] of ANNUAIRE_NORMALISE) {
    if (cle.length < 4) continue; // clés courtes trop permissives en sous-chaîne
    const motif = new RegExp(`(^|\\s)${cle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`);
    if (motif.test(nom)) return domaine;
  }

  // On préfère une icône de catégorie à un domaine .fr spéculatif : un logo
  // erroné est plus perturbant qu'un repli neutre.
  return null;
}

/** URL du logo Clearbit pour un domaine (taille en px). */
export function urlLogo(domaine, taille = 80) {
  if (!domaine) return null;
  return `https://logo.clearbit.com/${domaine}?size=${taille}&format=png`;
}

/** Repli fiable lorsque le logo principal n'est plus disponible. */
export function urlFavicon(domaine, taille = 80) {
  if (!domaine) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domaine)}&sz=${taille}`;
}
