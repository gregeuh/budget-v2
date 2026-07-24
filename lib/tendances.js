import { toutesCategories as CATEGORIES, cleMoisLocal, moisDecaleLocal, arrondir } from "./format";

/**
 * Évolution des dépenses par catégorie sur les derniers mois.
 * L'app dit où on en est ce mois-ci ; ceci dit si on dérive.
 */
export function tendances(transactions = [], nbMois = 3) {
  // Du plus ancien au plus récent : ["2026-05", "2026-06", "2026-07"]
  const mois = [];
  for (let i = nbMois - 1; i >= 0; i--) mois.push(moisDecaleLocal(-i));
  const moisCourant = cleMoisLocal();

  const parCategorie = new Map();
  const totaux = Object.fromEntries(mois.map((m) => [m, 0]));

  for (const t of transactions) {
    if (t.versId || t.horsSolde) continue;
    const cat = CATEGORIES[t.categorie] || CATEGORIES.autre;
    if (cat.type === "revenu" || cat.type === "virement") continue;
    if (t.montant >= 0) continue;

    const m = t.date.slice(0, 7);
    if (!(m in totaux)) continue;

    const val = Math.abs(t.montant);
    totaux[m] += val;

    if (!parCategorie.has(t.categorie)) {
      parCategorie.set(t.categorie, Object.fromEntries(mois.map((x) => [x, 0])));
    }
    parCategorie.get(t.categorie)[m] += val;
  }

  // Un mois en cours n'est pas comparable à un mois complet : on le signale
  // plutôt que de conclure trop vite sur une baisse.
  const moisComplets = mois.filter((m) => m !== moisCourant);
  const reference = moisComplets.length
    ? arrondir(moisComplets.reduce((a, m) => a + totaux[m], 0) / moisComplets.length)
    : 0;

  const lignes = [...parCategorie.entries()]
    .map(([id, valeurs]) => {
      const cat = CATEGORIES[id] || CATEGORIES.autre;
      const serie = mois.map((m) => arrondir(valeurs[m]));
      const complets = mois.map((m, i) => (m === moisCourant ? null : serie[i])).filter((v) => v !== null);
      const moyenne = complets.length ? arrondir(complets.reduce((a, v) => a + v, 0) / complets.length) : 0;
      const actuel = serie[serie.length - 1];
      const ecart = arrondir(actuel - moyenne);
      const pourcent = moyenne > 0 ? Math.round((ecart / moyenne) * 100) : null;

      return {
        id,
        label: cat.label,
        icone: cat.icone,
        couleur: cat.couleur,
        serie,
        total: arrondir(serie.reduce((a, v) => a + v, 0)),
        moyenne,
        actuel,
        ecart,
        pourcent,
        // On ne parle de hausse ou de baisse que si l'écart est significatif :
        // au-delà de 15 % et d'au moins 10 €, pour éviter le bruit.
        sens:
          pourcent === null || (Math.abs(pourcent) < 15 || Math.abs(ecart) < 10)
            ? "stable"
            : ecart > 0
            ? "hausse"
            : "baisse",
      };
    })
    .filter((l) => l.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    mois,
    moisCourant,
    totaux: Object.fromEntries(mois.map((m) => [m, arrondir(totaux[m])])),
    reference,
    lignes,
  };
}
