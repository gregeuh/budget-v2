import { nettoyerLibelle } from "./libelles";
import { devinerCategorie } from "./categorisation";

/**
 * Lecture des relevés bancaires CSV.
 * Sorti du composant pour être testable : ce parseur a déjà régressé
 * (format LCL sans en-tête, libellé en colonne variable, lignes de solde).
 */

export const detecterSeparateur = (ligne) => {
  const counts = { ";": (ligne.match(/;/g) || []).length, ",": (ligne.match(/,/g) || []).length, "\t": (ligne.match(/\t/g) || []).length };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

export const decouperLigne = (ligne, sep) => {
  // Gère les champs entre guillemets
  const out = [];
  let champ = "", dansGuillemets = false;
  for (const ch of ligne) {
    if (ch === '"') dansGuillemets = !dansGuillemets;
    else if (ch === sep && !dansGuillemets) { out.push(champ.trim()); champ = ""; }
    else champ += ch;
  }
  out.push(champ.trim());
  return out;
};

export const lireDate = (brut) => {
  if (!brut) return null;
  const s = String(brut).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    const a = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${a}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
};

export const lireMontant = (brut) => {
  if (!brut) return null;
  const nettoye = String(brut).replace(/\s|€|EUR/gi, "").replace(/\./g, (m, i, str) => (str.includes(",") ? "" : m)).replace(",", ".");
  const n = parseFloat(nettoye);
  return Number.isFinite(n) ? n : null;
};

export function analyserCSV(texte) {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length < 1) return { erreur: "Fichier vide ou illisible." };
  const sep = detecterSeparateur(lignes[0]);

  // Cherche une ligne d'en-tête (mot "date" + "montant/débit/libellé")
  let idxEntete = lignes.findIndex((l) => {
    const bas = l.toLowerCase();
    return /date/.test(bas) && /(montant|d[ée]bit|libell|amount)/.test(bas);
  });
  if (idxEntete > 5) idxEntete = -1;

  // ===== CAS 1 : le fichier a un en-tête =====
  if (idxEntete !== -1) {
    const entetes = decouperLigne(lignes[idxEntete], sep).map((e) => e.toLowerCase());
    const iDate = entetes.findIndex((e) => /date/.test(e));
    const iLibelle = entetes.findIndex((e) => /libell|label|description|designation|motif|nature|detail/.test(e));
    const iMontant = entetes.findIndex((e) => /montant|amount|^valeur/.test(e));
    const iDebit = entetes.findIndex((e) => /d[ée]bit/.test(e));
    const iCredit = entetes.findIndex((e) => /cr[ée]dit/.test(e));

    if (iDate !== -1 && (iMontant !== -1 || iDebit !== -1)) {
      const operations = [];
      for (const ligne of lignes.slice(idxEntete + 1)) {
        const ch = decouperLigne(ligne, sep);
        const date = lireDate(ch[iDate]);
        if (!date) continue;
        let montant = iMontant !== -1 ? lireMontant(ch[iMontant]) : null;
        if (montant === null && iDebit !== -1) {
          const deb = lireMontant(ch[iDebit]);
          const cre = iCredit !== -1 ? lireMontant(ch[iCredit]) : null;
          if (deb) montant = -Math.abs(deb);
          else if (cre) montant = Math.abs(cre);
        }
        if (montant === null || montant === 0) continue;
        const libelle = (iLibelle !== -1 ? ch[iLibelle] : "").replace(/\s+/g, " ").trim() || "Import CSV";
        operations.push({ date, montant, libelle: nettoyerLibelle(libelle), libelleBanque: libelle, categorie: devinerCategorie(libelle, montant) });
      }
      if (operations.length > 0) return { operations };
    }
  }

  // ===== CAS 2 : pas d'en-tête (ex. LCL) — on détecte la structure d'après les données =====
  // On repère, pour chaque colonne, celle qui contient des dates et celle qui contient des montants.
  const echantillon = lignes.slice(0, 40).map((l) => decouperLigne(l, sep));
  const nbCol = Math.max(...echantillon.map((c) => c.length));

  const estDate = (v) => lireDate(v) !== null;
  const estMontant = (v) => {
    const n = lireMontant(v);
    return n !== null && String(v).trim() !== "" && /[\d]/.test(String(v));
  };

  // Colonne date = celle où le plus de cellules sont des dates
  let colDate = -1, meilleurDate = 0;
  let colMontant = -1, meilleurMontant = 0;
  for (let c = 0; c < nbCol; c++) {
    let nbDate = 0, nbMontant = 0, total = 0;
    for (const ch of echantillon) {
      if (ch[c] === undefined || ch[c] === "") continue;
      total++;
      if (estDate(ch[c])) nbDate++;
      else if (estMontant(ch[c])) nbMontant++;
    }
    if (total >= 3) {
      if (nbDate / total > 0.6 && nbDate > meilleurDate) { meilleurDate = nbDate; colDate = c; }
      if (nbMontant / total > 0.5 && nbMontant > meilleurMontant) { meilleurMontant = nbMontant; colMontant = c; }
    }
  }

  if (colDate === -1 || colMontant === -1 || colDate === colMontant) {
    return { erreur: "Format non reconnu. Vérifie que ton relevé contient une date et un montant par ligne." };
  }

  // Le libellé peut se trouver dans des colonnes différentes selon le type d'opération
  // (LCL : 5e colonne pour les cartes, 6e pour les virements). On concatène donc toutes
  // les colonnes texte qui ne sont ni la date, ni le montant, ni un simple type/indicateur.
  const colsTexte = [];
  for (let c = 0; c < nbCol; c++) {
    if (c === colDate || c === colMontant) continue;
    let nbTexte = 0, total = 0;
    for (const ch of echantillon) {
      const v = (ch[c] || "").trim();
      if (!v) continue;
      total++;
      if (!estDate(v) && lireMontant(v) === null && v.length > 3) nbTexte++;
    }
    if (total > 0 && nbTexte > 0) colsTexte.push(c);
  }

  const MOTS_TECHNIQUES = /^(carte|virement|pr[ée]l[èe]vement|retrait dab|divers|liquide|0)$/i;

  const operations = [];
  for (const ch of lignes.map((l) => decouperLigne(l, sep))) {
    const date = lireDate(ch[colDate]);
    const montant = lireMontant(ch[colMontant]);
    if (!date || montant === null || montant === 0) continue;

    // Concatène les morceaux de libellé, en ignorant les mots purement techniques
    const morceaux = colsTexte
      .map((c) => (ch[c] || "").replace(/\s+/g, " ").trim())
      .filter((v) => v && !MOTS_TECHNIQUES.test(v));
    const libelleBrut = morceaux.join(" ").replace(/\s+/g, " ").trim();

    // Ligne de solde LCL : le libellé est un numéro de compte, ou il n'y a aucun vrai libellé
    if (/^\d{5}\s+\d+[A-Z]?$/.test(libelleBrut)) continue;
    if (!libelleBrut) continue; // lignes de solde en tête/pied (aucun libellé réel)

    operations.push({ date, montant, libelle: nettoyerLibelle(libelleBrut), libelleBanque: libelleBrut, categorie: devinerCategorie(libelleBrut, montant) });
  }

  if (operations.length === 0) return { erreur: "Aucune opération valide trouvée dans le fichier." };
  return { operations };
}
