/**
 * Jours ouvrés et jours fériés français.
 *
 * Nécessaire pour les salaires versés « le dernier jour ouvré du mois » :
 * la date change chaque mois, et un 31 tombant un samedi, un dimanche ou
 * un 1er mai décale le virement.
 */

// Dimanche de Pâques — algorithme de Meeus/Jones/Butcher (calendrier grégorien).
// Sert à placer le lundi de Pâques, l'Ascension et le lundi de Pentecôte.
function paques(annee) {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

const cle = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const decale = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const cache = new Map();

/** Ensemble des jours fériés d'une année (métropole). */
export function feries(annee) {
  if (cache.has(annee)) return cache.get(annee);

  const p = paques(annee);
  const set = new Set([
    cle(new Date(annee, 0, 1)),    // Jour de l'an
    cle(decale(p, 1)),             // Lundi de Pâques
    cle(new Date(annee, 4, 1)),    // Fête du travail
    cle(new Date(annee, 4, 8)),    // Victoire 1945
    cle(decale(p, 39)),            // Ascension
    cle(decale(p, 50)),            // Lundi de Pentecôte
    cle(new Date(annee, 6, 14)),   // Fête nationale
    cle(new Date(annee, 7, 15)),   // Assomption
    cle(new Date(annee, 10, 1)),   // Toussaint
    cle(new Date(annee, 10, 11)),  // Armistice 1918
    cle(new Date(annee, 11, 25)),  // Noël
  ]);

  cache.set(annee, set);
  return set;
}

/** Un jour ouvré : ni samedi, ni dimanche, ni férié. */
export function estOuvre(d) {
  const jour = d.getDay();
  if (jour === 0 || jour === 6) return false;
  return !feries(d.getFullYear()).has(cle(d));
}

/** Recule jusqu'au jour ouvré précédent (la date elle-même si elle convient). */
export function reculerAuJourOuvre(d) {
  let x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let garde = 0;
  while (!estOuvre(x) && garde++ < 15) x = decale(x, -1);
  return x;
}

/** Avance jusqu'au jour ouvré suivant (la date elle-même si elle convient). */
export function avancerAuJourOuvre(d) {
  let x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let garde = 0;
  while (!estOuvre(x) && garde++ < 15) x = decale(x, 1);
  return x;
}

/** Dernier jour ouvré du mois (annee, mois 0-11). */
export function dernierJourOuvre(annee, mois) {
  return reculerAuJourOuvre(new Date(annee, mois + 1, 0));
}

/** Premier jour ouvré du mois (annee, mois 0-11). */
export function premierJourOuvre(annee, mois) {
  return avancerAuJourOuvre(new Date(annee, mois, 1));
}

/**
 * Date de paie d'un mois donné, selon le mode choisi.
 * `jour` n'est utilisé que par les modes à date fixe.
 */
export function dateDePaie(annee, mois, mode = "jour", jour = 1) {
  const finDeMois = new Date(annee, mois + 1, 0).getDate();
  const borne = Math.min(Math.max(Number(jour) || 1, 1), finDeMois);

  switch (mode) {
    case "dernierOuvre":
      return dernierJourOuvre(annee, mois);
    case "premierOuvre":
      return premierJourOuvre(annee, mois);
    case "dernierJour":
      return new Date(annee, mois + 1, 0);
    case "ouvrePrecedent":
      // Jour fixe, avancé au jour ouvré précédent s'il tombe un week-end ou un férié.
      return reculerAuJourOuvre(new Date(annee, mois, borne));
    case "jour":
    default:
      return new Date(annee, mois, borne);
  }
}

export const MODES_SALAIRE = [
  { id: "jour", label: "Un jour fixe du mois", avecJour: true },
  { id: "ouvrePrecedent", label: "Jour fixe, avancé si week-end ou férié", avecJour: true },
  { id: "dernierOuvre", label: "Dernier jour ouvré du mois", avecJour: false },
  { id: "premierOuvre", label: "Premier jour ouvré du mois", avecJour: false },
  { id: "dernierJour", label: "Dernier jour du mois", avecJour: false },
];
