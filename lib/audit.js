import { detecterRecurrences, normaliserLibelle } from "./detection";
import { toutesCategories as CATEGORIES, cleMois } from "./format";

// Familles de services pour repérer les doublons ("j'ai 3 streamings vidéo")
const FAMILLES = [
  { cle: "video", label: "Vidéo", motifs: ["netflix", "disney", "prime", "canal", "ocs", "paramount", "appletv", "molotov", "salto"] },
  { cle: "musique", label: "Musique", motifs: ["spotify", "deezer", "apple music", "applemusic", "tidal", "youtube music", "amazon music"] },
  { cle: "cloud", label: "Stockage cloud", motifs: ["icloud", "google one", "dropbox", "onedrive", "mega"] },
  { cle: "sport", label: "Sport / fitness", motifs: ["basicfit", "basic fit", "fitness", "gym", "strava", "onair", "neoness"] },
  { cle: "presse", label: "Presse / lecture", motifs: ["monde", "figaro", "equipe", "kindle", "audible", "medium"] },
  { cle: "ia", label: "IA / productivité", motifs: ["chatgpt", "openai", "claude", "anthropic", "midjourney", "notion", "github"] },
];

function familleDe(libelle) {
  const l = normaliserLibelle(libelle);
  for (const f of FAMILLES) {
    if (f.motifs.some((m) => l.includes(m.replace(/\s/g, "")) || l.includes(m))) return f;
  }
  return null;
}

/**
 * Audit complet des dépenses récurrentes (charges détectées + récurrentes déjà créées).
 * Ne supprime rien : produit un diagnostic et des pistes.
 */
export function auditerDepenses({ transactions, recurrentes = [] }, { revenuMensuel = 0 } = {}) {
  // 1. Rassembler les charges récurrentes : celles détectées + celles déjà saisies comme récurrentes
  const detectees = detecterRecurrences(transactions).filter((d) => !d.revenu);

  const items = [];
  const vues = new Set();

  for (const d of detectees) {
    const cle = normaliserLibelle(d.libelle);
    vues.add(cle);
    const derniereDate = [...transactions]
      .filter((t) => normaliserLibelle(t.libelle) === cle)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || "";
    items.push({
      libelle: d.libelle,
      cle,
      montantMensuel: Math.abs(d.montantMedian),
      categorie: d.categorie,
      occurrences: d.occurrences,
      variable: d.variable,
      derniereDate,
      source: "detecte",
      famille: familleDe(d.libelle),
    });
  }

  // Les récurrentes créées manuellement mais non retrouvées dans l'historique
  for (const r of recurrentes) {
    if (r.actif === false || r.montant >= 0) continue;
    const cle = normaliserLibelle(r.libelle || "");
    if (vues.has(cle)) continue;
    items.push({
      libelle: r.libelle,
      cle,
      montantMensuel: Math.abs(r.montant),
      categorie: r.categorie,
      occurrences: null,
      variable: false,
      derniereDate: "",
      source: "recurrente",
      famille: familleDe(r.libelle || ""),
    });
  }

  // 2. Marquer les doublons de famille (plusieurs services du même type)
  const parFamille = new Map();
  for (const it of items) {
    if (!it.famille) continue;
    if (!parFamille.has(it.famille.cle)) parFamille.set(it.famille.cle, []);
    parFamille.get(it.famille.cle).push(it);
  }
  const doublons = [];
  for (const [, groupe] of parFamille) {
    if (groupe.length >= 2) {
      doublons.push({ famille: groupe[0].famille, items: groupe, total: groupe.reduce((a, x) => a + x.montantMensuel, 0) });
    }
  }

  // 3. Marquer les "dormants" : détectés mais plus prélevés depuis 6+ semaines
  const limite = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  for (const it of items) {
    it.dormant = it.derniereDate && it.derniereDate < limite;
  }

  // 4. Totaux
  const totalMensuel = items.reduce((a, x) => a + x.montantMensuel, 0);
  const totalAnnuel = totalMensuel * 12;
  const partRevenu = revenuMensuel > 0 ? totalMensuel / revenuMensuel : null;

  // 5. Économie potentielle (doublons + dormants, en gardant le moins cher de chaque doublon)
  let economie = 0;
  for (const d of doublons) {
    const trie = [...d.items].sort((a, b) => a.montantMensuel - b.montantMensuel);
    economie += trie.slice(1).reduce((a, x) => a + x.montantMensuel, 0); // tout sauf le moins cher
  }
  for (const it of items) {
    if (it.dormant && !it.famille) economie += it.montantMensuel;
  }

  return {
    items: items.sort((a, b) => b.montantMensuel - a.montantMensuel),
    doublons,
    totalMensuel: Math.round(totalMensuel * 100) / 100,
    totalAnnuel: Math.round(totalAnnuel),
    partRevenu,
    economiePotentielle: Math.round(economie * 100) / 100,
    economieAnnuelle: Math.round(economie * 12),
  };
}
