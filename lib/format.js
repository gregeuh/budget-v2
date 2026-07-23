import { dateDePaie } from "./joursOuvres";

/**
 * Arrondi monétaire. Additionner des décimales en binaire produit des artefacts
 * (0,1 + 0,2 = 0,30000000000000004). Tout cumul d'argent doit passer par ici.
 *
 * La correction par epsilon est nécessaire pour les demi-centimes : 1,005 vaut
 * en réalité 1,00499999… en binaire, et s'arrondirait donc à 1,00.
 * On arrondit symétriquement (le demi s'éloigne de zéro), comme on l'attend
 * pour de l'argent : 1,005 → 1,01 et −1,005 → −1,01.
 */
export const arrondir = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  const signe = v < 0 ? -1 : 1;
  const abs = Math.abs(v);
  return (signe * Math.round((abs + Number.EPSILON * abs) * 100)) / 100;
};

export const euros = (n, opts = {}) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Math.abs(n) >= 1000 && !opts.precis ? 0 : 2,
    ...opts,
  }).format(n || 0);

export const dateCourte = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export const moisLabel = (iso) => {
  const s = new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const cleMois = (iso) => (iso || "").slice(0, 7); // "2026-07"

// Date locale au format ISO (YYYY-MM-DD).
// À NE PAS remplacer par toISOString() : celui-ci convertit en UTC, ce qui décale
// d'un jour (et donc d'un mois en début de mois) pour tout fuseau en avance sur UTC.
export const isoLocal = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// Clé de mois locale (YYYY-MM) à partir d'un objet Date
export const cleMoisLocal = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// Décalage de n mois par rapport au mois courant → "YYYY-MM"
export const moisDecaleLocal = (n = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return cleMoisLocal(d);
};

export const aujourdhui = () => isoLocal();

// ---- Types de comptes ----
export const TYPES_COMPTE = {
  courant: { label: "Compte courant", icone: "🏦", couleur: "ciel", groupe: "courant" },
  revolut: { label: "Revolut", icone: "💳", couleur: "lavande", groupe: "courant" },
  swile: { label: "Swile (titres-resto)", icone: "🍽️", couleur: "peche", groupe: "avantages" },
  livretA: { label: "Livret A", icone: "🐷", couleur: "menthe", groupe: "epargne" },
  ldds: { label: "LDDS", icone: "🌱", couleur: "menthe", groupe: "epargne" },
  pea: { label: "PEA / Bourse", icone: "📈", couleur: "beurre", groupe: "invest" },
  especes: { label: "Espèces", icone: "💶", couleur: "beurre", groupe: "courant" },
  autre: { label: "Autre", icone: "💼", couleur: "ciel", groupe: "courant" },
};

// Palette d'IDENTITÉ : elle sert à distinguer des éléments entre eux
// (comptes, catégories, parts de graphique). Volontairement plus large que
// les quatre rôles sémantiques de l'interface, sinon tout se ressemblerait.
export const COULEURS = {
  menthe: { fond: "var(--id-vert-pale)", texte: "var(--id-vert-texte)", vif: "#34C759" },
  corail: { fond: "var(--id-rouge-pale)", texte: "var(--id-rouge-texte)", vif: "#FF3B30" },
  lavande: { fond: "var(--id-indigo-pale)", texte: "var(--id-indigo-texte)", vif: "#5856D6" },
  ciel: { fond: "var(--id-bleu-pale)", texte: "var(--id-bleu-texte)", vif: "#007AFF" },
  peche: { fond: "var(--id-orange-pale)", texte: "var(--id-orange-texte)", vif: "#FF9500" },
  beurre: { fond: "var(--id-ambre-pale)", texte: "var(--id-ambre-texte)", vif: "#FFCC00" },
};

// ---- Catégories de transactions (type: besoin / envie / epargne, logique 50/30/20) ----
export const CATEGORIES = {
  logement: { label: "Logement", icone: "🏠", type: "besoin" },
  courses: { label: "Courses", icone: "🛒", type: "besoin" },
  transport: { label: "Transport", icone: "🚗", type: "besoin" },
  sante: { label: "Santé", icone: "💊", type: "besoin" },
  factures: { label: "Factures & assurances", icone: "🧾", type: "besoin" },
  animaux: { label: "Animaux", icone: "🐶", type: "besoin" },
  resto: { label: "Restos & sorties", icone: "🍕", type: "envie" },
  shopping: { label: "Shopping", icone: "🛍️", type: "envie" },
  loisirs: { label: "Loisirs & sport", icone: "⚽", type: "envie" },
  abonnements: { label: "Abonnements", icone: "📺", type: "envie" },
  voyages: { label: "Voyages", icone: "✈️", type: "envie" },
  epargne: { label: "Épargne & invest.", icone: "💰", type: "epargne" },
  salaire: { label: "Salaire", icone: "💼", type: "revenu" },
  autresRevenus: { label: "Autres revenus", icone: "🎁", type: "revenu" },
  autre: { label: "Autre", icone: "📦", type: "envie" },
  virement: { label: "Virement interne", icone: "🔁", type: "virement" },
  ajustement: { label: "Ajustement de solde", icone: "🧮", type: "virement" },
};

export const PLAFONDS = { livretA: 22950, ldds: 12000 };

// Prochaine date d'arrivée du salaire (ISO), ou null si non renseignée.
// `mode` gère les salaires sans date fixe (dernier jour ouvré du mois, etc.).
export function prochaineDateSalaire(jourSalaire, mode = "jour") {
  const aDateFixe = mode === "jour" || mode === "ouvrePrecedent";
  if (aDateFixe && (!jourSalaire || jourSalaire < 1)) return null;

  const auj = new Date();
  const aujMinuit = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate());

  let d = dateDePaie(auj.getFullYear(), auj.getMonth(), mode, jourSalaire);
  if (d < aujMinuit) {
    d = dateDePaie(auj.getFullYear(), auj.getMonth() + 1, mode, jourSalaire);
  }
  return isoLocal(d);
}

// Vrai dès qu'une règle de salaire exploitable est renseignée.
export function salaireConfigure(profil = {}) {
  const mode = profil.modeSalaire || "jour";
  if (mode === "jour" || mode === "ouvrePrecedent") return (profil.jourSalaire || 0) >= 1;
  return true;
}

// Registre fusionné : catégories natives + personnalisées.
// Mis à jour par le store ; utilisé par les fonctions pures (conseils, stats).
export const toutesCategories = { ...CATEGORIES };
export function definirCategoriesPerso(perso = {}) {
  for (const cle of Object.keys(toutesCategories)) {
    if (toutesCategories[cle].perso) delete toutesCategories[cle];
  }
  for (const [cle, c] of Object.entries(perso)) {
    if (!CATEGORIES[cle] && c?.label) {
      toutesCategories[cle] = { label: c.label, icone: c.icone || "🏷️", type: c.type || "envie", perso: true };
    }
  }
}

// ---- Récurrences ----
export const FREQUENCES = {
  hebdomadaire: { label: "Chaque semaine", court: "hebdo" },
  mensuelle: { label: "Chaque mois", court: "mensuel" },
  annuelle: { label: "Chaque année", court: "annuel" },
};

export function prochaineOccurrence(dateISO, frequence, opts = {}) {
  const [a, m, j] = dateISO.split("-").map(Number);
  if (!a || !m || !j) return null;
  if (!["hebdomadaire", "mensuelle", "annuelle"].includes(frequence)) return null;
  if (frequence === "hebdomadaire") {
    const d = new Date(Date.UTC(a, m - 1, j + 7));
    return d.toISOString().slice(0, 10);
  }
  if (frequence === "annuelle") {
    const d = new Date(Date.UTC(a + 1, m - 1, Math.min(j, 28)));
    return d.toISOString().slice(0, 10);
  }
  // Mensuelle avec une règle (dernier jour ouvré…) : on recalcule la date
  // du mois suivant au lieu de figer le numéro du jour.
  const mode = opts.mode || "jour";
  if (mode !== "jour") {
    return isoLocal(dateDePaie(a, m, mode, opts.jour || j));
  }

  // Mensuelle : conserve le jour, borné à la fin du mois suivant
  const cible = new Date(Date.UTC(a, m, 1));
  const dernierJour = new Date(Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0)).getUTCDate();
  cible.setUTCDate(Math.min(j, dernierJour));
  return cible.toISOString().slice(0, 10);
}

// Prochaine date de salaire, en objet Date (voir prochaineDateSalaire pour l'ISO)
export function prochainSalaire(jour, mode = "jour") {
  const iso = prochaineDateSalaire(jour, mode);
  if (!iso) return null;
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(a, m - 1, j);
}
