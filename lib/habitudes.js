import { nettoyerLibelle } from "./libelles";

// Normalise un libellé pour comparer deux commerçants entre eux
const cle = (s = "") =>
  nettoyerLibelle(String(s).trim())
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´.,\-_*]/g, "")   // apostrophes et ponctuation : "Fran's" == "Frans"
    .replace(/\s+/g, " ")
    .trim();

/**
 * Construit la mémoire des habitudes à partir de l'historique.
 * Pour chaque commerçant : la catégorie et le lieu les plus fréquents.
 * Retourne une Map : cleCommercant -> { categorie, lieu, libelle, occurrences }
 */
export function construireMemoire(transactions = []) {
  const memoire = new Map();

  for (const t of transactions) {
    if (t.versId) continue;
    const source = t.libelle || t.libelleBanque || "";
    const k = cle(source);
    if (!k || k.length < 2) continue;

    if (!memoire.has(k)) {
      memoire.set(k, { libelle: source.trim(), cats: {}, lieux: {}, occurrences: 0, derniere: t.date || "" });
    }
    const e = memoire.get(k);
    e.occurrences++;
    if (t.categorie) e.cats[t.categorie] = (e.cats[t.categorie] || 0) + 1;
    if (t.lieu && t.lieu.trim()) {
      const l = t.lieu.trim();
      e.lieux[l] = (e.lieux[l] || 0) + 1;
    }
    // Garder le libellé de l'occurrence la plus récente (le mieux nommé, souvent)
    if ((t.date || "") >= e.derniere) {
      e.derniere = t.date || "";
      e.libelle = source.trim();
    }
  }

  // Réduire aux valeurs dominantes
  const resultat = new Map();
  for (const [k, e] of memoire) {
    const dominant = (obj) => {
      let best = null, n = 0;
      for (const [v, c] of Object.entries(obj)) if (c > n) { n = c; best = v; }
      return best;
    };
    resultat.set(k, {
      libelle: e.libelle,
      categorie: dominant(e.cats),
      lieu: dominant(e.lieux),
      occurrences: e.occurrences,
    });
  }
  return resultat;
}

/**
 * Devine la catégorie et le lieu d'un libellé saisi, d'après l'historique.
 * Cherche d'abord une correspondance exacte, puis un préfixe, puis une inclusion.
 * Retourne null si rien de fiable.
 */
export function devinerDepuisHistorique(libelleSaisi, memoire) {
  const k = cle(libelleSaisi);
  if (!k || k.length < 2 || !memoire || memoire.size === 0) return null;

  // 1. Correspondance exacte
  if (memoire.has(k)) {
    const e = memoire.get(k);
    return { ...e, confiance: "exacte" };
  }

  // 2. Correspondance par préfixe ou inclusion, la plus fréquente d'abord
  let meilleur = null;
  for (const [mk, e] of memoire) {
    if (mk.startsWith(k) || k.startsWith(mk) || (k.length >= 4 && mk.includes(k))) {
      if (!meilleur || e.occurrences > meilleur.occurrences) meilleur = e;
    }
  }
  return meilleur ? { ...meilleur, confiance: "approchante" } : null;
}

/**
 * Propose les commerçants connus qui correspondent à ce qui est en train d'être tapé.
 * Pour l'autocomplétion en direct : tri par pertinence (préfixe d'abord) puis fréquence.
 */
export function proposerLibelles(saisie, memoire, limite = 5) {
  if (!saisie || !saisie.trim()) return [];
  const k = cle(saisie);
  if (!k || k.length < 1 || !memoire || memoire.size === 0) return [];

  const trouves = [];
  for (const [mk, e] of memoire) {
    if (mk === k) continue; // déjà exactement saisi : rien à proposer
    let rang = null;
    if (mk.startsWith(k)) rang = 0;
    else if (k.length >= 2 && mk.includes(k)) rang = 1;
    if (rang === null) continue;
    trouves.push({ ...e, rang });
  }
  trouves.sort((a, b) => a.rang - b.rang || b.occurrences - a.occurrences);
  return trouves.slice(0, limite);
}

/**
 * Propose les lieux déjà utilisés, triés par fréquence (pour l'autocomplétion).
 * Si "saisie" est fourni, ne garde que ceux qui correspondent.
 */
export function lieuxConnus(transactions = [], limite = 8, saisie = "") {
  const compte = {};
  for (const t of transactions) {
    if (!t.lieu || !t.lieu.trim()) continue;
    const l = t.lieu.trim();
    compte[l] = (compte[l] || 0) + 1;
  }
  const q = saisie && saisie.trim() ? cle(saisie) : "";
  return Object.entries(compte)
    .filter(([lieu]) => !q || cle(lieu).includes(q))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([lieu]) => lieu);
}
