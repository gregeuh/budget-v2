import { arrondir } from "./format";

/**
 * Calcul des soldes par compte.
 * Sorti du store pour être testable : cette logique a déjà régressé
 * (les opérations futures étaient comptées dans le solde du jour).
 */
export function calculerSoldes(comptes = [], transactions = [], auj) {
  const map = {};
  for (const c of comptes) map[c.id] = c.soldeInitial || 0;

  for (const t of transactions) {
    if (t.horsSolde) continue;
    // Une opération datée dans le futur n'a pas encore bougé l'argent :
    // elle appartient au "à venir", pas au solde actuel.
    if (auj && t.date > auj) continue;

    if (t.versId) {
      const val = Math.abs(t.montant);
      if (map[t.compteId] !== undefined) map[t.compteId] -= val;
      if (map[t.versId] !== undefined) map[t.versId] += val;
    } else if (map[t.compteId] !== undefined) {
      map[t.compteId] += t.montant;
    }
  }
  // Arrondi final : sans cela, un cumul de décimales donne 603.8899999999994
  for (const id of Object.keys(map)) map[id] = arrondir(map[id]);
  return map;
}
