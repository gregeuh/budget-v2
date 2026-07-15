import { toutesCategories as CATEGORIES } from "./format";
import { detecterRecurrences } from "./detection";

// Mots-clés d'abonnements courants (pour reconnaître et catégoriser les "fuites")
const ABONNEMENTS_CONNUS = {
  streaming: { mots: ["netflix", "disney", "prime", "canal", "spotify", "deezer", "apple music", "youtube", "paramount", "crunchyroll", "molotov", "ocs"], label: "Streaming / musique", icone: "🎬" },
  logiciel: { mots: ["icloud", "google one", "dropbox", "adobe", "microsoft", "office", "chatgpt", "notion", "figma", "canva"], label: "Logiciels / cloud", icone: "💾" },
  telecom: { mots: ["orange", "sfr", "free", "bouygues", "sosh", "red", "prixtel"], label: "Téléphone / internet", icone: "📶" },
  sport: { mots: ["basic fit", "basic-fit", "fitness", "gym", "onair", "keepcool", "neoness", "salle"], label: "Sport / salle", icone: "🏋️" },
  presse: { mots: ["monde", "figaro", "equipe", "mediapart", "telerama", "abonnement presse"], label: "Presse", icone: "📰" },
  jeux: { mots: ["playstation", "xbox", "nintendo", "game pass", "psplus", "ea play"], label: "Jeux vidéo", icone: "🎮" },
  autre: { mots: [], label: "Autre abonnement", icone: "🔄" },
};

function categoriserAbonnement(libelle = "") {
  const l = libelle.toLowerCase();
  for (const [cle, def] of Object.entries(ABONNEMENTS_CONNUS)) {
    if (def.mots.some((m) => l.includes(m))) return { type: cle, ...def };
  }
  return null;
}

/**
 * Analyse les dépenses récurrentes et identifie les pistes d'économie.
 * Retourne :
 *  - recurrences : toutes les charges récurrentes, triées par coût annuel
 *  - abonnements : le sous-ensemble reconnu comme abonnements (les "fuites" faciles à couper)
 *  - doublons : groupes du même type (2 services de streaming, 2 salles…)
 *  - totalMensuel / totalAnnuel : le poids total des récurrences
 *  - pistes : suggestions concrètes d'économie
 */
export function analyserDepenses(transactions, recurrentes = []) {
  // On combine les récurrentes déclarées ET celles détectées dans l'historique
  const detectees = detecterRecurrences(transactions).filter((d) => !d.revenu);

  const items = [];
  const vues = new Set();

  // 1. Récurrentes déclarées (les plus fiables)
  for (const r of recurrentes) {
    if (r.actif === false || r.montant >= 0) continue;
    const cout = Math.abs(r.montant);
    const abo = categoriserAbonnement(r.libelle);
    const cle = (r.libelle || "").toLowerCase().trim();
    vues.add(cle);
    items.push({
      libelle: r.libelle || "Charge",
      mensuel: cout,
      annuel: cout * 12,
      categorie: r.categorie,
      abonnement: abo,
      source: "declaree",
      recurrenteId: r.id,
    });
  }

  // 2. Détectées mais non déclarées (fuites potentielles cachées)
  for (const d of detectees) {
    const cle = (d.libelle || "").toLowerCase().trim();
    if (vues.has(cle)) continue;
    const cout = Math.abs(d.montantMedian);
    const abo = categoriserAbonnement(d.libelle);
    items.push({
      libelle: d.libelle,
      mensuel: cout,
      annuel: cout * 12,
      categorie: d.categorie,
      abonnement: abo,
      variable: d.variable,
      source: "detectee",
    });
  }

  items.sort((a, b) => b.annuel - a.annuel);

  const abonnements = items.filter((i) => i.abonnement);
  const totalMensuel = items.reduce((a, i) => a + i.mensuel, 0);
  const totalAnnuel = totalMensuel * 12;
  const totalAbonnements = abonnements.reduce((a, i) => a + i.mensuel, 0);

  // 3. Doublons : plusieurs abonnements du même type
  const parType = {};
  for (const a of abonnements) {
    const t = a.abonnement.type;
    (parType[t] = parType[t] || []).push(a);
  }
  const doublons = Object.entries(parType)
    .filter(([, arr]) => arr.length >= 2)
    .map(([type, arr]) => ({
      type,
      label: ABONNEMENTS_CONNUS[type]?.label || type,
      icone: ABONNEMENTS_CONNUS[type]?.icone || "🔄",
      items: arr,
      economieMensuelle: arr.slice(1).reduce((a, i) => a + i.mensuel, 0), // garder le moins cher
    }));

  // 4. Pistes d'économie concrètes
  const pistes = [];
  for (const d of doublons) {
    pistes.push({
      titre: `${d.items.length} abonnements ${d.label.toLowerCase()}`,
      detail: `${d.items.map((i) => i.libelle).join(", ")} — en garder un seul économiserait ${Math.round(d.economieMensuelle)} €/mois.`,
      economieAnnuelle: Math.round(d.economieMensuelle * 12),
      icone: d.icone,
    });
  }
  // Petits abonnements oubliés (< 15 €, faciles à laisser traîner)
  const petits = abonnements.filter((a) => a.mensuel < 15 && !doublons.some((d) => d.items.includes(a)));
  if (petits.length >= 3) {
    const somme = petits.reduce((a, i) => a + i.mensuel, 0);
    pistes.push({
      titre: `${petits.length} petits abonnements`,
      detail: `${petits.map((i) => i.libelle).join(", ")} — de petites sommes qui totalisent ${Math.round(somme)} €/mois.`,
      economieAnnuelle: Math.round(somme * 12),
      icone: "🔍",
    });
  }

  pistes.sort((a, b) => b.economieAnnuelle - a.economieAnnuelle);

  return {
    items,
    abonnements,
    doublons,
    pistes,
    totalMensuel: Math.round(totalMensuel),
    totalAnnuel: Math.round(totalAnnuel),
    totalAbonnements: Math.round(totalAbonnements),
    economieMax: pistes.reduce((a, p) => a + p.economieAnnuelle, 0),
  };
}
