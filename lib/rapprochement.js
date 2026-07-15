import { normaliserLibelle } from "./detection";

const joursEntre = (a, b) => Math.round(Math.abs(new Date(a) - new Date(b)) / 86400000);

// Similarité de libellés : proportion de mots communs (0 à 1)
function similarite(a, b) {
  const motsA = new Set(normaliserLibelle(a).split(" ").filter((m) => m.length > 2));
  const motsB = new Set(normaliserLibelle(b).split(" ").filter((m) => m.length > 2));
  if (motsA.size === 0 || motsB.size === 0) return 0;
  let communs = 0;
  for (const m of motsA) if (motsB.has(m)) communs++;
  return communs / Math.min(motsA.size, motsB.size);
}

/**
 * Confronte chaque ligne importée aux opérations déjà présentes.
 * Ne décide RIEN : classe et propose des candidats, l'utilisateur tranche.
 *
 * Statuts :
 *  - "probable"  : même montant exact, date à ±3 jours → fusion suggérée
 *  - "incertain" : montant identique mais date éloignée, OU date proche et montant très voisin
 *  - "importee"  : déjà venue d'un import précédent (même origine CSV)
 *  - "nouvelle"  : aucune correspondance
 */
export function rapprocher(lignes, existantes, compteId) {
  const candidatesCompte = existantes.filter((t) => t.compteId === compteId && !t.versId);
  const dejaUtilisees = new Set();

  return lignes.map((ligne, index) => {
    const candidats = [];

    for (const t of candidatesCompte) {
      if (dejaUtilisees.has(t.id)) continue;

      const ecartMontant = Math.abs(t.montant - ligne.montant);
      const ecartJours = joursEntre(t.date, ligne.date);
      const sim = similarite(t.libelle || "", ligne.libelle || "");

      const memeMontant = ecartMontant < 0.005;
      // Tolérance : pourboire, arrondi, frais — 5 % ou 2 €, le plus grand des deux
      const montantVoisin = ecartMontant < Math.max(2, Math.abs(ligne.montant) * 0.05);

      if (memeMontant && ecartJours <= 3) {
        candidats.push({ tx: t, ecartJours, ecartMontant, sim, niveau: "probable", raison: ecartJours === 0 ? "Montant et date identiques" : `Montant identique, ${ecartJours} j d'écart` });
      } else if (memeMontant && ecartJours <= 10) {
        candidats.push({ tx: t, ecartJours, ecartMontant, sim, niveau: "incertain", raison: `Montant identique, ${ecartJours} jours d'écart` });
      } else if (montantVoisin && ecartJours <= 3 && ecartMontant > 0.005) {
        candidats.push({ tx: t, ecartJours, ecartMontant, sim, niveau: "incertain", raison: `Écart de ${ecartMontant.toFixed(2)} €, ${ecartJours} j` });
      } else if (sim >= 0.6 && ecartJours <= 5 && montantVoisin) {
        candidats.push({ tx: t, ecartJours, ecartMontant, sim, niveau: "incertain", raison: "Libellé et montant proches" });
      }
    }

    // Le meilleur candidat : d'abord le niveau, puis la similarité de libellé, puis la proximité de date
    candidats.sort((a, b) => {
      if (a.niveau !== b.niveau) return a.niveau === "probable" ? -1 : 1;
      if (Math.abs(b.sim - a.sim) > 0.15) return b.sim - a.sim;
      return a.ecartJours - b.ecartJours;
    });

    const meilleur = candidats[0] || null;

    // Déjà importée : une opération identique portant la marque d'un import
    const dejaImportee = candidatesCompte.find(
      (t) =>
        t.importe &&
        Math.abs(t.montant - ligne.montant) < 0.005 &&
        t.date === ligne.date &&
        similarite(t.libelle || "", ligne.libelle || "") >= 0.8
    );

    let statut = "nouvelle";
    if (dejaImportee) statut = "importee";
    else if (meilleur?.niveau === "probable") statut = "probable";
    else if (meilleur?.niveau === "incertain") statut = "incertain";

    if (meilleur && statut === "probable") dejaUtilisees.add(meilleur.tx.id);

    return {
      index,
      ligne,
      statut,
      candidats: candidats.slice(0, 3),
      choix: statut === "probable" ? { action: "fusionner", txId: meilleur.tx.id } :
             statut === "incertain" ? { action: "verifier", txId: meilleur.tx.id } :
             statut === "importee" ? { action: "ignorer", txId: null } :
             { action: "ajouter", txId: null },
    };
  });
}

// Impact de l'import sur le solde du compte, selon les choix en cours
export function impactSolde(decisions) {
  let delta = 0;
  for (const d of decisions) {
    if (d.choix.action === "ajouter") delta += d.ligne.montant;
    // "fusionner" : l'opération existe déjà → aucun impact
    // "ignorer" / "verifier" non résolu : aucun impact
  }
  return Math.round(delta * 100) / 100;
}
