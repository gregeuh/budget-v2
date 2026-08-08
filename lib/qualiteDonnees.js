import { nettoyerLibelle } from "./libelles";

// Bilan volontairement prudent : il ne modifie jamais les opérations.
// Il met seulement en avant les points qui méritent une décision humaine.
export function analyserQualiteDonnees(transactions = [], categories = {}) {
  const sansCategorie = transactions.filter((t) => !t.categorie || !categories[t.categorie] || t.categorie === "autre");
  const sansLibelle = transactions.filter((t) => !String(t.libelle || "").trim() || t.libelle === "Import CSV");
  const groupes = new Map();

  for (const t of transactions) {
    if (t.versId || t.categorie === "virement" || t.categorie === "ajustement") continue;
    const nom = nettoyerLibelle(t.libelle || "").toLocaleLowerCase("fr-FR");
    if (!nom) continue;
    const cle = `${t.compteId || ""}|${t.date || ""}|${Number(t.montant || 0).toFixed(2)}|${nom}`;
    groupes.set(cle, [...(groupes.get(cle) || []), t]);
  }

  const doublons = [...groupes.values()].filter((groupe) => groupe.length > 1);
  const libellesBruts = transactions.filter((t) => {
    const brut = String(t.libelleBanque || "").trim();
    return brut && nettoyerLibelle(brut) !== String(t.libelle || "").trim();
  });

  return {
    total: transactions.length,
    sansCategorie,
    sansLibelle,
    doublons,
    libellesBruts,
    points: sansCategorie.length + sansLibelle.length + doublons.length,
  };
}
