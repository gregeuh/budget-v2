// Nettoyage des libellés bancaires — module partagé (import CSV + renommage en masse)

export const MARQUES = {
  "carrefour": "Carrefour", "auchan": "Auchan", "monop": "Monoprix", "monoprix": "Monoprix",
  "amazon": "Amazon", "amzn": "Amazon", "amz": "Amazon", "apple": "Apple", "paypal": "PayPal",
  "netflix": "Netflix", "spotify": "Spotify", "deezer": "Deezer", "disney": "Disney+",
  "bouygues": "Bouygues Telecom", "orange": "Orange", "sfr": "SFR", "free": "Free",
  "edf": "EDF", "engie": "Engie", "total": "TotalEnergies", "uber": "Uber", "deliveroo": "Deliveroo",
  "mcdonald": "McDonald's", "starbucks": "Starbucks", "fnac": "Fnac", "decathlon": "Decathlon",
  "nike": "Nike", "adidas": "Adidas", "zalando": "Zalando", "snipes": "Snipes", "revolut": "Revolut",
  "sncf": "SNCF", "navigo": "Navigo", "airbnb": "Airbnb", "booking": "Booking", "zara": "Zara",
  "leclerc": "Leclerc", "lidl": "Lidl", "aldi": "Aldi", "ikea": "Ikea", "fanatics": "Fanatics",
  "withings": "Withings", "aroma-zone": "Aroma-Zone", "horace": "Horace", "citadium": "Citadium",
  "sumup": "SumUp", "spliiit": "Spliiit", "klarna": "Klarna", "sagasport": "Sagasport",
  "mcdo": "McDonald's", "eyeswatch": "Eyeswatch", "planet panda": "Planet Panda", "espace foot": "Espace Foot",
  "louis pion": "Louis Pion", "europcar": "Europcar", "leetchi": "Leetchi", "delivroo": "Deliveroo",
  "estanquet": "L'Estanquet", "fran's verdu": "Fran's Verdu", "la cave": "La Cave", "pains etc": "Pains Etc",
  "pret personnel": "Prêt personnel", "pret immo": "Prêt immobilier", "assurance lcl": "Assurance LCL",
  "gaz de bordeaux": "Gaz de Bordeaux", "regie eau": "Régie des eaux", "mae assurance": "MAE Assurance",
  "tenue de compte": "Frais de tenue de compte", "livret a": "Virement Livret A",
  "spb": "SPB Assurance", "lac air": "LAC AIR", "asf": "Autoroute ASF", "atlandes": "Autoroute Atlandes",
  "carreleur": "Carreleur", "mcdonald's": "McDonald's", "starbuck": "Starbucks", "relais": "Relais",
};

export function nettoyerLibelle(brut = "") {
  const basBrut = brut.toLowerCase();
  for (const [motif, propre] of Object.entries(MARQUES)) {
    if (basBrut.includes(motif)) return propre;
  }
  let s = brut
    .replace(/\b(CB|PRLV|SEPA|VIR|VIREMENT|PRELEVEMENT|PAIEMENT|ACHAT|FACTURE|ECHEANCE|CARTE|RETRAIT DAB|INST|PERMANENT|SARL|SAS|SA)\b/gi, " ")
    .replace(/\d{2}[\/.\-]\d{2}([\/.\-]\d{2,4})?/g, " ")
    .replace(/\*+/g, " ")
    .replace(/[A-Z]{2,}\d{2,}/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const mots = s.split(" ").filter((m) => m.length > 1 && !/^\d+$/.test(m)).slice(0, 3);
  const joli = mots.join(" ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return joli || brut.trim() || "Opération";
}
