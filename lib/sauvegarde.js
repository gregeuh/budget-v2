const CHAMPS_SAUVEGARDE = ["comptes", "transactions", "budgets", "recurrentes", "projets", "credits", "profil", "categoriesPerso"];

export function estSauvegardePecule(donnees) {
  return Boolean(
    donnees &&
    typeof donnees === "object" &&
    !Array.isArray(donnees) &&
    CHAMPS_SAUVEGARDE.some((champ) => Object.prototype.hasOwnProperty.call(donnees, champ))
  );
}

export function resumeSauvegarde(donnees = {}) {
  return {
    comptes: Array.isArray(donnees.comptes) ? donnees.comptes.length : 0,
    transactions: Array.isArray(donnees.transactions) ? donnees.transactions.length : 0,
    recurrentes: Array.isArray(donnees.recurrentes) ? donnees.recurrentes.length : 0,
    projets: Array.isArray(donnees.projets) ? donnees.projets.length : 0,
    credits: Array.isArray(donnees.credits) ? donnees.credits.length : 0,
    budgets: donnees.budgets && typeof donnees.budgets === "object" ? Object.keys(donnees.budgets).length : 0,
    exporteLe: typeof donnees.exporteLe === "string" ? donnees.exporteLe : null,
  };
}
