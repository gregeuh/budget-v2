import { TYPES_COMPTE, aujourdhui, prochaineOccurrence, prochaineDateSalaire, isoLocal } from "./format";

// Source unique du "reste à vivre" : utilisée par l'accueil ET la page Opérations,
// pour que les deux écrans affichent toujours le même chiffre.
export function calculerProjection({ comptes, soldes, transactions, recurrentes, profil }) {
  const auj = aujourdhui();
  const salaireISO = prochaineDateSalaire(profil.jourSalaire);
  const horizonISO = salaireISO || isoLocal(new Date(Date.now() + 30 * 86400000));

  // Comptes du quotidien : ni épargne, ni investissement (les titres-resto comptent : ils se dépensent)
  const scope = new Set(
    comptes
      .filter((c) => !["epargne", "invest"].includes((TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe))
      .map((c) => c.id)
  );
  const dispo = comptes.filter((c) => scope.has(c.id)).reduce((a, c) => a + (soldes[c.id] || 0), 0);

  // Opérations futures réelles + occurrences projetées des récurrentes, jusqu'à l'horizon
  const aVenir = [];
  for (const t of transactions) {
    if (t.date > auj && t.date <= horizonISO) aVenir.push({ ...t, virtuel: false });
  }
  for (const r of recurrentes) {
    if (r.actif === false) continue;
    let d = r.prochaine;
    let garde = 0;
    while (d && d <= horizonISO && garde < 24) {
      if (d > auj) {
        aVenir.push({
          id: `${r.id}-${d}`,
          date: d,
          montant: r.montant,
          categorie: r.categorie,
          libelle: r.libelle,
          compteId: r.compteId,
          virtuel: true,
        });
      }
      d = prochaineOccurrence(d, r.frequence);
      garde++;
    }
  }
  aVenir.sort((a, b) => a.date.localeCompare(b.date));

  let prevu = 0;
  let attendu = 0;
  for (const t of aVenir) {
    if (t.horsSolde) continue;
    if (salaireISO && t.date >= salaireISO) continue; // le jour de paie remet les compteurs à zéro
    let impact = 0;
    if (t.versId) {
      const val = Math.abs(t.montant);
      if (scope.has(t.compteId)) impact -= val;
      if (scope.has(t.versId)) impact += val;
    } else if (scope.has(t.compteId)) {
      impact = t.montant;
    }
    if (impact < 0) prevu += -impact;
    else attendu += impact;
  }

  const reste = dispo - prevu + attendu;
  const jours = Math.max(1, Math.round((new Date(horizonISO) - new Date(auj)) / 86400000));

  return { dispo, prevu, attendu, reste, jours, salaireISO, horizonISO, aVenir, parJour: reste / jours };
}
