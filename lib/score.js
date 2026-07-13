import { TYPES_COMPTE, aujourdhui, cleMois, isoLocal } from "./format";
import { statsMois } from "./conseils";

const borner = (v, min = 0, max = 20) => Math.max(min, Math.min(max, v));

export function calculerScore({ transactions, comptes, soldes, budgets, credits, recurrentes, profil }) {
  const mois = cleMois(aujourdhui());
  const s = statsMois(transactions, mois);
  const revenu = s.revenus || profil.revenuMensuel || 0;
  const piliers = [];

  // 1. Taux d'épargne du mois (cible : 20 %)
  const taux = revenu > 0 ? (revenu - s.depenses) / revenu : 0;
  piliers.push({
    id: "epargne",
    icone: "💰",
    label: "Taux d'épargne",
    points: revenu > 0 ? Math.round(borner((taux / 0.2) * 20)) : 10,
    detail: revenu > 0 ? `${Math.round(taux * 100)} % ce mois-ci (cible 20 %)` : "Renseigne tes revenus pour l'évaluer",
    conseil: "Vise 20 % de tes revenus mis de côté chaque mois — automatise avec un virement récurrent vers ton Livret A.",
  });

  // 2. Fonds d'urgence (cible : 3 mois de dépenses en épargne disponible)
  const epargneDispo = comptes
    .filter((c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe === "epargne")
    .reduce((a, c) => a + Math.max(0, soldes[c.id] || 0), 0);
  const depensesRef = s.depenses || revenu * 0.8 || 1;
  const moisCouverts = epargneDispo / depensesRef;
  piliers.push({
    id: "urgence",
    icone: "🛟",
    label: "Fonds d'urgence",
    points: Math.round(borner((moisCouverts / 3) * 20)),
    detail: `${moisCouverts.toFixed(1)} mois de dépenses couverts (cible 3)`,
    conseil: "Constitue 3 mois de dépenses sur ton Livret A avant tout autre objectif : c'est ton airbag financier.",
  });

  // 3. Budgets respectés
  const entrees = Object.entries(budgets || {}).filter(([, l]) => l > 0);
  if (entrees.length === 0) {
    piliers.push({
      id: "budgets", icone: "🎯", label: "Budgets", points: 10,
      detail: "Aucun budget défini",
      conseil: "Fixe des plafonds sur 2-3 catégories sensibles (courses, restos, shopping) pour cadrer sans te priver.",
    });
  } else {
    const respectes = entrees.filter(([cat, limite]) => (s.parCategorie[cat] || 0) <= limite).length;
    piliers.push({
      id: "budgets", icone: "🎯", label: "Budgets",
      points: Math.round(borner((respectes / entrees.length) * 20)),
      detail: `${respectes}/${entrees.length} budget${entrees.length > 1 ? "s" : ""} respecté${respectes > 1 ? "s" : ""} ce mois-ci`,
      conseil: "Un budget dépassé n'est pas un échec : ajuste le plafond ou la dépense, mais garde le cap sur les autres.",
    });
  }

  // 4. Endettement (cible : 0 %, seuil critique : 35 %)
  const mensualites = credits.reduce((a, c) => a + (c.mensualite || 0), 0);
  const tauxDette = revenu > 0 ? mensualites / revenu : 0;
  piliers.push({
    id: "dette",
    icone: "🏦",
    label: "Endettement",
    points: mensualites === 0 ? 20 : Math.round(borner(20 - (tauxDette / 0.35) * 20)),
    detail: mensualites === 0 ? "Aucun crédit en cours" : `${Math.round(tauxDette * 100)} % des revenus en mensualités`,
    conseil: "Sous 35 % d'endettement tu restes finançable ; chaque crédit soldé libère du reste à vivre.",
  });

  // 5. Régularité (l'app ne vaut que si elle est tenue à jour)
  const semaine = isoLocal(new Date(Date.now() - 7 * 86400000));
  const recente = transactions.some((t) => t.date >= semaine);
  const aRecurrentes = recurrentes.some((r) => r.actif !== false);
  const aJourSalaire = (profil.jourSalaire || 0) >= 1;
  piliers.push({
    id: "regularite",
    icone: "📆",
    label: "Régularité",
    points: (recente ? 10 : 0) + (aRecurrentes ? 5 : 0) + (aJourSalaire ? 5 : 0),
    detail: recente ? "Suivi à jour cette semaine" : "Aucune opération depuis 7 jours",
    conseil: "Saisis (ou importe) au fil de l'eau, automatise le fixe en récurrent, et renseigne ton jour de paie.",
  });

  const total = piliers.reduce((a, p) => a + p.points, 0);
  const niveau =
    total >= 80 ? { label: "Excellent", emoji: "🏆", couleur: "#2BB68C" } :
    total >= 60 ? { label: "Solide", emoji: "💪", couleur: "#3E9BFF" } :
    total >= 40 ? { label: "En construction", emoji: "🧱", couleur: "#F5B93E" } :
    { label: "Fragile", emoji: "🌱", couleur: "#FF6B5E" };

  const faible = [...piliers].sort((a, b) => a.points - b.points)[0];
  return { total, piliers, niveau, faible };
}
