import { toutesCategories } from "./format";

const normaliser = (t) =>
  (t || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Interprète une requête et renvoie les transactions correspondantes, triées par pertinence.
// Cherche dans : libellé, libellé banque, catégorie, lieu, compte, montant.
// Comprend aussi des filtres simples : ">50", "<20", "=15", et les mots "revenu"/"dépense".
export function rechercher(requete, transactions, comptes, categoriesPerso = {}) {
  const q = normaliser(requete.trim());
  if (!q) return [];

  const cats = toutesCategories;
  const nomCompte = (id) => comptes.find((c) => c.id === id)?.nom || "";

  // Détection d'un filtre de montant (>50, <20, =15, ou juste un nombre)
  let filtreMontant = null;
  const mMontant = q.match(/^([<>=]?)\s*(\d+([.,]\d+)?)\s*€?$/);
  if (mMontant) {
    const op = mMontant[1] || "~";
    const val = parseFloat(mMontant[2].replace(",", "."));
    filtreMontant = { op, val };
  }

  const filtreType = /\b(revenu|entree|entrée|credit)\b/.test(q) ? "revenu"
    : /\b(depense|dépense|sortie|debit)\b/.test(q) ? "depense" : null;

  const resultats = [];
  for (const t of transactions) {
    if (t.versId) continue;
    const cat = cats[t.categorie] || cats.autre;
    const montantAbs = Math.abs(t.montant);

    // Filtre montant
    if (filtreMontant) {
      const { op, val } = filtreMontant;
      if (op === ">" && !(montantAbs > val)) continue;
      if (op === "<" && !(montantAbs < val)) continue;
      if (op === "=" && Math.abs(montantAbs - val) > 0.005) continue;
      if (op === "~" && Math.abs(montantAbs - val) > val * 0.1 + 1) continue; // approximatif
      resultats.push({ t, score: 3 });
      continue;
    }

    // Filtre type seul
    if (filtreType && !filtreMontant) {
      const estRevenu = t.montant > 0;
      if (filtreType === "revenu" && estRevenu) { resultats.push({ t, score: 2 }); continue; }
      if (filtreType === "depense" && !estRevenu) { resultats.push({ t, score: 2 }); continue; }
      continue;
    }

    // Recherche texte, avec score selon le champ qui matche
    const champs = [
      { v: t.libelle, poids: 5 },
      { v: t.libelleBanque, poids: 4 },
      { v: cat.label, poids: 3 },
      { v: t.lieu, poids: 3 },
      { v: nomCompte(t.compteId), poids: 2 },
    ];
    let score = 0;
    for (const { v, poids } of champs) {
      const nv = normaliser(v);
      if (!nv) continue;
      if (nv === q) score += poids * 2;
      else if (nv.startsWith(q)) score += poids * 1.5;
      else if (nv.includes(q)) score += poids;
    }
    if (score > 0) resultats.push({ t, score });
  }

  resultats.sort((a, b) => b.score - a.score || b.t.date.localeCompare(a.t.date));
  return resultats.map((r) => r.t);
}
