import { CATEGORIES, cleMois } from "./format";

const FUSEAU = "Europe/Paris";

function dateParis(date = new Date()) {
  const parties = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const valeur = (type) => parties.find((partie) => partie.type === type)?.value;
  return `${valeur("year")}-${valeur("month")}-${valeur("day")}`;
}

function ajouterJours(iso, jours) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

function euros(montant) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(montant || 0);
}

function moisPrecedent(iso) {
  const [annee, mois] = iso.slice(0, 7).split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nomMois(cle) {
  const nom = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date(`${cle}-15T12:00:00Z`));
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

/** Alertes basées uniquement sur les données réelles de la personne. */
export function alertesUtiles({ transactions = [], recurrentes = [], budgets = {}, profil = {} }, maintenant = new Date()) {
  const aujourdHui = dateParis(maintenant);
  const demain = ajouterJours(aujourdHui, 1);
  const mois = aujourdHui.slice(0, 7);
  const preferences = { echeances: profil.notifications?.echeances !== false, budgets: profil.notifications?.budgets !== false, bilan: profil.notifications?.bilan !== false };
  const alertes = [];

  if (preferences.echeances) {
    const aVenir = [
      ...transactions.filter((transaction) => transaction.date === demain && Number(transaction.montant) < 0),
      ...recurrentes.filter((recurrence) => recurrence.actif !== false && recurrence.prochaine === demain && Number(recurrence.montant) < 0).map((recurrence) => ({ ...recurrence, date: recurrence.prochaine })),
    ].sort((a, b) => Number(a.montant) - Number(b.montant));
    if (aVenir.length) {
      const premiere = aVenir[0];
      const suivant = aVenir.length - 1;
      alertes.push({ id: `echeance-${demain}`, priorite: 30, title: "Échéance demain", body: `${premiere.libelle || "Paiement à venir"} · −${euros(Math.abs(premiere.montant))}${suivant ? ` et ${suivant} autre${suivant > 1 ? "s" : ""}` : ""}`, url: "/calendrier", tag: "pecule-echeance" });
    }
  }

  if (preferences.budgets) {
    const depenses = {};
    for (const transaction of transactions) {
      if (cleMois(transaction.date) !== mois || transaction.versId || Number(transaction.montant) >= 0) continue;
      const categorie = CATEGORIES[transaction.categorie] || CATEGORIES.autre;
      if (categorie.type === "virement") continue;
      depenses[transaction.categorie] = (depenses[transaction.categorie] || 0) + Math.abs(Number(transaction.montant));
    }
    const vigilance = Object.entries(budgets).map(([id, limite]) => ({ id, limite: Number(limite), depense: depenses[id] || 0 })).filter(({ limite, depense }) => limite > 0 && depense / limite >= 0.8).sort((a, b) => b.depense / b.limite - a.depense / a.limite)[0];
    if (vigilance) {
      const ratio = Math.round((vigilance.depense / vigilance.limite) * 100);
      const categorie = CATEGORIES[vigilance.id] || CATEGORIES.autre;
      const depasse = ratio >= 100;
      alertes.push({ id: `budget-${mois}-${vigilance.id}`, priorite: depasse ? 40 : 20, title: depasse ? `Budget ${categorie.label} dépassé` : `Budget ${categorie.label} à surveiller`, body: depasse ? `${euros(vigilance.depense)} dépensés pour ${euros(vigilance.limite)} prévus.` : `${ratio} % consommés · il reste ${euros(vigilance.limite - vigilance.depense)}.`, url: "/budgets", tag: "pecule-budget" });
    }
  }

  if (preferences.bilan && Number(aujourdHui.slice(8, 10)) <= 3) {
    const precedent = moisPrecedent(aujourdHui);
    const operations = transactions.filter((transaction) => cleMois(transaction.date) === precedent && !transaction.versId);
    const sorties = operations.filter((transaction) => Number(transaction.montant) < 0).reduce((total, transaction) => total + Math.abs(Number(transaction.montant)), 0);
    const entrees = operations.filter((transaction) => Number(transaction.montant) > 0).reduce((total, transaction) => total + Number(transaction.montant), 0);
    if (operations.length) alertes.push({ id: `bilan-${precedent}`, priorite: 10, title: `Ton bilan de ${nomMois(precedent)} est prêt`, body: `${euros(sorties)} de sorties · ${entrees >= sorties ? "mois maîtrisé" : "à regarder ensemble"}.`, url: "/cloture", tag: "pecule-bilan" });
  }
  return alertes.sort((a, b) => b.priorite - a.priorite);
}

export function cleAlerteQuotidienne(date = new Date()) { return dateParis(date); }
