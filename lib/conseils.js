import { CATEGORIES, TYPES_COMPTE, PLAFONDS, euros, cleMois } from "./format";

const moisDecale = (n) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
};

export function statsMois(transactions, mois) {
  const txs = transactions.filter((t) => cleMois(t.date) === mois && (CATEGORIES[t.categorie] || CATEGORIES.autre).type !== "virement");
  let revenus = 0, depenses = 0, epargne = 0;
  const parCategorie = {};
  const parType = { besoin: 0, envie: 0, epargne: 0 };
  for (const t of txs) {
    const cat = CATEGORIES[t.categorie] || CATEGORIES.autre;
    if (cat.type === "revenu") { revenus += t.montant; continue; }
    const val = Math.abs(t.montant);
    if (t.montant < 0) {
      depenses += val;
      parCategorie[t.categorie] = (parCategorie[t.categorie] || 0) + val;
      if (parType[cat.type] !== undefined) parType[cat.type] += val;
      if (cat.type === "epargne") epargne += val;
    }
  }
  return { revenus, depenses, epargne, parCategorie, parType, solde: revenus - depenses };
}

export function detecterAbonnements(transactions) {
  // Regroupe par libellé + montant identiques sur au moins 2 mois différents
  const groupes = {};
  for (const t of transactions) {
    if (t.montant >= 0 || (CATEGORIES[t.categorie] || CATEGORIES.autre).type === "virement") continue;
    const cle = `${(t.libelle || "").trim().toLowerCase()}|${Math.abs(t.montant).toFixed(2)}`;
    if (!groupes[cle]) groupes[cle] = { libelle: t.libelle, montant: Math.abs(t.montant), mois: new Set() };
    groupes[cle].mois.add(cleMois(t.date));
  }
  return Object.values(groupes)
    .filter((g) => g.mois.size >= 2 && g.libelle)
    .sort((a, b) => b.montant - a.montant);
}

export function genererConseils({ comptes, transactions, soldes, budgets, profil, credits = [], projets = [] }) {
  const conseils = [];
  const mois = moisDecale(0);
  const moisPrec = moisDecale(-1);
  const s = statsMois(transactions, mois);
  const sPrec = statsMois(transactions, moisPrec);
  const revenu = s.revenus || profil.revenuMensuel || 0;

  // 1. Taux d'épargne
  if (revenu > 0) {
    const taux = Math.round(((revenu - s.depenses + s.epargne * 0) / revenu) * 100);
    if (taux >= 20) {
      conseils.push({ ton: "bravo", icone: "🏆", titre: `Taux d'épargne : ${taux} %`, texte: "Au-dessus des 20 % recommandés ce mois-ci. Continue comme ça." });
    } else if (taux >= 0) {
      conseils.push({ ton: "info", icone: "🎯", titre: `Taux d'épargne : ${taux} %`, texte: `Objectif classique : 20 %. Il te faudrait mettre de côté ${euros(Math.max(0, revenu * 0.2 - (revenu - s.depenses)))} de plus ce mois-ci.` });
    } else {
      conseils.push({ ton: "alerte", icone: "🚨", titre: "Dépenses supérieures aux revenus", texte: `Ce mois-ci, tu as dépensé ${euros(s.depenses - revenu)} de plus que tes revenus.` });
    }
  }

  // 2. Règle 50/30/20
  if (revenu > 0 && s.depenses > 0) {
    const pB = Math.round((s.parType.besoin / revenu) * 100);
    const pE = Math.round((s.parType.envie / revenu) * 100);
    if (pB > 55) conseils.push({ ton: "info", icone: "🏠", titre: `Besoins : ${pB} % des revenus`, texte: "La règle 50/30/20 vise 50 % max pour les besoins essentiels. Regarde si certaines charges fixes peuvent être renégociées (assurances, forfaits, énergie)." });
    if (pE > 35) conseils.push({ ton: "alerte", icone: "🛍️", titre: `Envies : ${pE} % des revenus`, texte: "Au-delà des 30 % conseillés. Les catégories plaisir sont souvent le levier le plus rapide pour rééquilibrer." });
  }

  // 3. Dépassements de budgets
  for (const [cat, limite] of Object.entries(budgets || {})) {
    const reel = s.parCategorie[cat] || 0;
    if (limite > 0 && reel > limite) {
      const c = CATEGORIES[cat] || CATEGORIES.autre;
      conseils.push({ ton: "alerte", icone: c.icone, titre: `Budget ${c.label} dépassé`, texte: `${euros(reel)} dépensés pour ${euros(limite)} prévus (${Math.round((reel / limite) * 100)} %).` });
    } else if (limite > 0 && reel > limite * 0.8) {
      const c = CATEGORIES[cat] || CATEGORIES.autre;
      conseils.push({ ton: "info", icone: c.icone, titre: `Budget ${c.label} bientôt atteint`, texte: `${Math.round((reel / limite) * 100)} % consommés. Il reste ${euros(limite - reel)}.` });
    }
  }

  // 4. Catégorie en forte hausse vs mois précédent
  for (const [cat, val] of Object.entries(s.parCategorie)) {
    const prec = sPrec.parCategorie[cat] || 0;
    if (prec > 30 && val > prec * 1.5 && val - prec > 50) {
      const c = CATEGORIES[cat] || CATEGORIES.autre;
      conseils.push({ ton: "info", icone: "📈", titre: `${c.label} en hausse`, texte: `${euros(val)} ce mois-ci contre ${euros(prec)} le mois dernier (+${Math.round(((val - prec) / prec) * 100)} %).` });
      break;
    }
  }

  // 5. Plafond Livret A / LDDS
  for (const c of comptes) {
    const plafond = c.type === "livretA" ? PLAFONDS.livretA : c.type === "ldds" ? PLAFONDS.ldds : null;
    if (plafond) {
      const solde = soldes[c.id] || 0;
      if (solde >= plafond * 0.95) {
        conseils.push({ ton: "info", icone: "🐷", titre: `${c.nom} proche du plafond`, texte: `${euros(solde)} sur ${euros(plafond)} max de versements. Au-delà, pense à un autre support (LDDS, PEA, assurance-vie) pour continuer à faire travailler ton épargne.` });
      }
    }
  }

  // 6. Fonds d'urgence (3 mois de dépenses en épargne dispo)
  const epargneDispo = comptes
    .filter((c) => TYPES_COMPTE[c.type]?.groupe === "epargne")
    .reduce((acc, c) => acc + (soldes[c.id] || 0), 0);
  const depensesMoyennes = (s.depenses + sPrec.depenses) / (sPrec.depenses > 0 ? 2 : 1);
  if (depensesMoyennes > 0) {
    const moisCouverts = epargneDispo / depensesMoyennes;
    if (moisCouverts < 3) {
      conseils.push({ ton: "info", icone: "🛟", titre: "Fonds d'urgence à renforcer", texte: `Ton épargne disponible couvre environ ${moisCouverts.toFixed(1)} mois de dépenses. L'objectif de sécurité classique est de 3 mois (${euros(depensesMoyennes * 3)}).` });
    } else {
      conseils.push({ ton: "bravo", icone: "🛟", titre: "Fonds d'urgence solide", texte: `${moisCouverts.toFixed(1)} mois de dépenses couverts par ton épargne disponible.` });
    }
  }

  // 7. Abonnements récurrents détectés
  const abos = detecterAbonnements(transactions);
  if (abos.length >= 2) {
    const total = abos.reduce((a, b) => a + b.montant, 0);
    conseils.push({ ton: "info", icone: "🔁", titre: `${abos.length} paiements récurrents détectés`, texte: `Environ ${euros(total)} / mois : ${abos.slice(0, 4).map((a) => a.libelle).join(", ")}${abos.length > 4 ? "…" : ""}. Un tri annuel des abonnements fait souvent gagner 20 à 50 € par mois.` });
  }

  // 8. Solde titres-resto qui dort
  const swile = comptes.find((c) => c.type === "swile");
  if (swile && (soldes[swile.id] || 0) > 120) {
    conseils.push({ ton: "info", icone: "🍽️", titre: "Solde Swile élevé", texte: `${euros(soldes[swile.id])} sur ton compte titres-resto. Pense à l'utiliser en priorité pour les courses et déjeuners éligibles : c'est de l'argent déjà fléché.` });
  }

  // 9. Taux d'endettement
  const mensualites = credits.reduce((a, c) => a + (c.mensualite || 0), 0);
  if (mensualites > 0 && revenu > 0) {
    const tauxEndettement = Math.round((mensualites / revenu) * 100);
    if (tauxEndettement > 35) {
      conseils.push({ ton: "alerte", icone: "🏦", titre: `Endettement : ${tauxEndettement} % des revenus`, texte: `${euros(mensualites)} de mensualités par mois. Le seuil de vigilance des banques est à 35 % : un rachat ou un remboursement anticipé peut être à étudier.` });
    } else {
      conseils.push({ ton: "info", icone: "🏦", titre: `Endettement : ${tauxEndettement} % des revenus`, texte: `${euros(mensualites)} de mensualités par mois, sous le seuil des 35 %.` });
    }
  }

  // 10. Rythme nécessaire pour les projets avec échéance
  for (const p of projets) {
    if (!p.echeance || !p.objectif || (p.montantActuel || 0) >= p.objectif) continue;
    const moisRestants = Math.round((new Date(p.echeance) - new Date()) / (30.44 * 86400000));
    if (moisRestants <= 0) {
      conseils.push({ ton: "info", icone: p.icone || "🎯", titre: `Projet ${p.nom} : échéance passée`, texte: `Il manque ${euros(p.objectif - (p.montantActuel || 0))}. Décale l'échéance ou ajuste l'objectif.` });
    } else {
      const parMois = (p.objectif - (p.montantActuel || 0)) / moisRestants;
      conseils.push({ ton: "info", icone: p.icone || "🎯", titre: `Projet ${p.nom}`, texte: `Mets de côté ~${euros(parMois)} / mois pendant ${moisRestants} mois pour atteindre ${euros(p.objectif)} à temps.` });
    }
    break; // un seul conseil projet à la fois
  }

  const ordre = { alerte: 0, info: 1, bravo: 2 };
  return conseils.sort((a, b) => ordre[a.ton] - ordre[b.ton]);
}

// Résumé anonymisé envoyé au coach IA (aucune donnée personnelle identifiante)
export function resumePourCoach({ comptes, transactions, soldes, budgets, profil, credits = [], projets = [] }) {
  const mois = moisDecale(0);
  const moisPrec = moisDecale(-1);
  const s = statsMois(transactions, mois);
  const sPrec = statsMois(transactions, moisPrec);
  return {
    devise: "EUR",
    revenuMensuelDeclare: profil.revenuMensuel || null,
    comptes: comptes.map((c) => ({ type: c.type, solde: Math.round(soldes[c.id] || 0) })),
    moisEnCours: {
      revenus: Math.round(s.revenus),
      depenses: Math.round(s.depenses),
      parCategorie: Object.fromEntries(Object.entries(s.parCategorie).map(([k, v]) => [k, Math.round(v)])),
    },
    moisPrecedent: { revenus: Math.round(sPrec.revenus), depenses: Math.round(sPrec.depenses) },
    budgets,
    abonnementsDetectes: detecterAbonnements(transactions).map((a) => ({ libelle: a.libelle, montant: a.montant })),
    credits: credits.map((c) => ({ restant: Math.round(c.restant || 0), mensualite: Math.round(c.mensualite || 0), taux: c.taux || 0 })),
    projets: projets.map((p) => ({ objectif: Math.round(p.objectif || 0), epargne: Math.round(p.montantActuel || 0), echeance: p.echeance || null })),
  };
}
