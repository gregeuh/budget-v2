import { toutesCategories } from "./format";

const normaliser = (t) =>
  (t || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Interprète une requête et renvoie les transactions correspondantes, triées par pertinence.
// Cherche dans : libellé, libellé banque, catégorie, lieu, compte, montant.
// Comprend aussi des filtres simples : ">50", "<20", "=15", et les mots "revenu"/"dépense".
export function rechercher(requete, transactions, comptes, categoriesPerso = {}) {
  const q = normaliser(requete.trim());
  if (!q) return [];

  const cats = { ...toutesCategories, ...categoriesPerso };
  const nomCompte = (id) => comptes.find((c) => c.id === id)?.nom || "";

  // Un montant peut être seul (« >50 ») ou compléter une recherche
  // (« Carrefour >50 »). Dans ce second cas, le commerçant reste un critère.
  let filtreMontant = null;
  const mMontant = q.match(/(?:^|\s)([<>=]?)\s*(\d+(?:[.,]\d+)?)\s*€?(?=$|\s)/);
  if (mMontant) {
    const op = mMontant[1] || "~";
    const val = parseFloat(mMontant[2].replace(",", "."));
    filtreMontant = { op, val };
  }

  const filtreType = /\b(revenu|entree|entrée|credit)\b/.test(q) ? "revenu"
    : /\b(depense|dépense|sortie|debit)\b/.test(q) ? "depense" : null;
  const texteSansFiltres = q
    .replace(mMontant?.[0] || "", " ")
    .replace(/\b(revenu|entree|entrée|credit|depense|dépense|sortie|debit)\b/g, " ")
    .trim();
  const termes = texteSansFiltres.split(/\s+/).filter(Boolean);

  const resultats = [];
  for (const t of transactions) {
    if (t.versId) continue;
    const cat = cats[t.categorie] || cats.autre;
    const montantAbs = Math.abs(t.montant);

    // Filtres structurels : montant et type peuvent être combinés avec le texte.
    if (filtreMontant) {
      const { op, val } = filtreMontant;
      if (op === ">" && !(montantAbs > val)) continue;
      if (op === "<" && !(montantAbs < val)) continue;
      if (op === "=" && Math.abs(montantAbs - val) > 0.005) continue;
      if (op === "~" && Math.abs(montantAbs - val) > val * 0.1 + 1) continue; // approximatif
    }
    if (filtreType) {
      const estRevenu = t.montant > 0;
      if ((filtreType === "revenu" && !estRevenu) || (filtreType === "depense" && estRevenu)) continue;
    }

    // Recherche texte : chaque mot doit correspondre à au moins un champ,
    // ce qui permet « Carrefour >50 », « café Bordeaux », etc.
    const champs = [
      { v: t.libelle, poids: 5 },
      { v: t.libelleBanque, poids: 4 },
      { v: cat.label, poids: 3 },
      { v: t.lieu, poids: 3 },
      { v: nomCompte(t.compteId), poids: 2 },
    ];
    let score = filtreMontant ? 3 : 0;
    let tousLesTermesCorrespondent = true;
    for (const terme of termes) {
      let meilleur = 0;
      for (const { v, poids } of champs) {
        const nv = normaliser(v);
        if (!nv) continue;
        if (nv === terme) meilleur = Math.max(meilleur, poids * 2);
        else if (nv.startsWith(terme)) meilleur = Math.max(meilleur, poids * 1.5);
        else if (nv.includes(terme)) meilleur = Math.max(meilleur, poids);
      }
      if (meilleur === 0) { tousLesTermesCorrespondent = false; break; }
      score += meilleur;
    }
    if (tousLesTermesCorrespondent && (score > 0 || filtreType)) resultats.push({ t, score: score || 2 });
  }

  resultats.sort((a, b) => b.score - a.score || b.t.date.localeCompare(a.t.date));
  return resultats.map((r) => r.t);
}
