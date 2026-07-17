import { toutesCategories as CATEGORIES, cleMois } from "./format";

// Nettoie un libellé bancaire : "PRLV SEPA ORANGE SA 12/07" -> "orange"
const BRUIT = /\b(prlv|prelevement|prélèvement|sepa|vir|virement|cb|carte|paiement|achat|ecom|facture|mensualite|mensualité|ref|mandat|id|du|le|sa|sas|sarl|france|fr)\b/gi;

// Les libellés contiennent souvent le mois ("LOYER JUILLET") : sans ça, chaque mois
// formerait un groupe distinct et aucune récurrence ne serait détectée.
const MOIS = /\b(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre|jan|fev|fév|avr|jui|juil|sept|oct|nov|dec|déc)\b/gi;

export function normaliserLibelle(libelle = "") {
  return libelle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d{2}[\/\-.]\d{2}([\/\-.]\d{2,4})?/g, " ") // dates
    .replace(/\b\d{4,}\b/g, " ")                          // numéros de mandat/carte
    .replace(BRUIT, " ")
    .replace(MOIS, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const moisEntre = (a, b) => {
  const [aa, am] = a.split("-").map(Number);
  const [ba, bm] = b.split("-").map(Number);
  return (ba - aa) * 12 + (bm - am);
};

const jourDe = (iso) => Number(iso.slice(8, 10));
const mediane = (arr) => {
  const t = [...arr].sort((x, y) => x - y);
  return t[Math.floor(t.length / 2)];
};

/**
 * Détecte les charges (et revenus) récurrents dans l'historique.
 * Tolère les montants qui varient (électricité) et les libellés bruités.
 * Retourne : [{ libelle, montantMedian, variable, jour, categorie, compteId, occurrences, confiance }]
 */
export function detecterRecurrences(transactions, { minOccurrences = 2 } = {}) {
  const groupes = new Map();

  for (const t of transactions) {
    const cat = CATEGORIES[t.categorie] || CATEGORIES.autre;
    if (cat.type === "virement" || t.versId || t.horsSolde) continue;
    // Utiliser le libellé banque (stable) en priorité : un renommage manuel ne doit pas
    // casser la détection des récurrences.
    const cle = normaliserLibelle(t.libelleBanque || t.libelle);
    if (!cle || cle.length < 3) continue;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(t);
  }

  const trouvees = [];

  for (const [cle, txs] of groupes) {
    // Une occurrence par mois maximum (on garde la plus proche du montant médian)
    const parMois = new Map();
    for (const t of txs) {
      const m = cleMois(t.date);
      if (!parMois.has(m)) parMois.set(m, t);
    }
    const mois = [...parMois.keys()].sort();
    if (mois.length < minOccurrences) continue;

    // Les mois doivent se suivre (tolérance : un trou)
    let reguliers = true;
    for (let i = 1; i < mois.length; i++) {
      const ecart = moisEntre(mois[i - 1], mois[i]);
      if (ecart > 2) { reguliers = false; break; }
    }
    if (!reguliers) continue;

    const occ = mois.map((m) => parMois.get(m));
    const montants = occ.map((t) => t.montant);
    const med = mediane(montants);
    if (Math.abs(med) < 1) continue;

    // Écart de montant : au-delà de 25 %, c'est une charge "variable"
    const ecartMax = Math.max(...montants.map((v) => Math.abs((v - med) / med)));
    if (ecartMax > 0.6) continue; // trop irrégulier : ce n'est pas une récurrence

    const jours = occ.map((t) => jourDe(t.date));
    const jourMedian = mediane(jours);
    const dispersionJour = Math.max(...jours.map((j) => Math.abs(j - jourMedian)));
    if (dispersionJour > 6) continue; // ne tombe pas à date fixe

    const derniere = occ[occ.length - 1];
    const confiance =
      (mois.length >= 3 ? 0.4 : 0.25) +
      (ecartMax < 0.05 ? 0.35 : ecartMax < 0.25 ? 0.2 : 0.1) +
      (dispersionJour <= 2 ? 0.25 : 0.1);

    trouvees.push({
      cle,
      libelle: derniere.libelle || cle,
      montantMedian: Math.round(med * 100) / 100,
      variable: ecartMax > 0.25,
      jour: Math.min(28, Math.max(1, Math.round(jourMedian))),
      categorie: derniere.categorie,
      compteId: derniere.compteId,
      occurrences: mois.length,
      confiance: Math.min(1, Math.round(confiance * 100) / 100),
      revenu: med > 0,
    });
  }

  return trouvees.sort((a, b) => Math.abs(b.montantMedian) - Math.abs(a.montantMedian));
}
