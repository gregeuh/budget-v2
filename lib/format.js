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

export const aujourdhui = () => new Date().toISOString().slice(0, 10);

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

export const COULEURS = {
  menthe: { fond: "var(--menthe-pale)", texte: "var(--menthe-texte)", vif: "#2BB68C" },
  corail: { fond: "var(--corail-pale)", texte: "var(--corail-texte)", vif: "#FF6B5E" },
  lavande: { fond: "var(--lavande-pale)", texte: "var(--lavande-texte)", vif: "#8B7CF6" },
  ciel: { fond: "var(--ciel-pale)", texte: "var(--ciel-texte)", vif: "#3E9BFF" },
  peche: { fond: "var(--peche-pale)", texte: "var(--peche-texte)", vif: "#FF9D5C" },
  beurre: { fond: "var(--beurre-pale)", texte: "var(--beurre-texte)", vif: "#F5B93E" },
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

// ---- Récurrences ----
export const FREQUENCES = {
  hebdomadaire: { label: "Chaque semaine", court: "hebdo" },
  mensuelle: { label: "Chaque mois", court: "mensuel" },
  annuelle: { label: "Chaque année", court: "annuel" },
};

export function prochaineOccurrence(dateISO, frequence) {
  const [a, m, j] = dateISO.split("-").map(Number);
  if (frequence === "hebdomadaire") {
    const d = new Date(Date.UTC(a, m - 1, j + 7));
    return d.toISOString().slice(0, 10);
  }
  if (frequence === "annuelle") {
    const d = new Date(Date.UTC(a + 1, m - 1, Math.min(j, 28)));
    return d.toISOString().slice(0, 10);
  }
  // Mensuelle : conserve le jour, borné à la fin du mois suivant
  const cible = new Date(Date.UTC(a, m, 1));
  const dernierJour = new Date(Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0)).getUTCDate();
  cible.setUTCDate(Math.min(j, dernierJour));
  return cible.toISOString().slice(0, 10);
}

// Prochaine date de salaire à partir du jour du mois configuré
export function prochainSalaire(jour) {
  if (!jour) return null;
  const auj = new Date();
  const a = auj.getFullYear(), m = auj.getMonth();
  const borne = (an, mo) => Math.min(jour, new Date(an, mo + 1, 0).getDate());
  let d = new Date(a, m, borne(a, m));
  if (d < new Date(a, m, auj.getDate())) d = new Date(a, m + 1, borne(a, m + 1));
  return d;
}
