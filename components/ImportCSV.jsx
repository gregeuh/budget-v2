"use client";

import { useMemo, useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, dateCourte } from "@/lib/format";
import Sheet from "./Sheet";
import PointsSautillants from "./PointsSautillants";
import Rapprochement from "./Rapprochement";

// ---- Catégorisation automatique par mots-clés (banques françaises) ----
const REGLES_CAT = [
  ["courses", /carrefour|leclerc|lidl|aldi|auchan|intermarche|monoprix|franprix|casino|grand frais|picard|biocoop/i],
  ["resto", /mcdo|mc donald|burger|kfc|uber\s*eats|deliveroo|resto|restaurant|pizz|sushi|kebab|brasserie|bistro/i],
  ["transport", /sncf|ratp|navigo|total|esso|bp\s|shell|autoroute|vinci|sanef|uber(?!\s*eats)|blablacar|parking/i],
  ["abonnements", /netflix|spotify|disney|canal\+?|prime video|deezer|apple\.com|icloud|youtube|psn|playstation|xbox|basic.?fit|onair/i],
  ["factures", /edf|engie|totalenergies|veolia|free\s|orange|sfr|bouygues|sosh|red by|assurance|mutuelle|maif|maaf|matmut|axa/i],
  ["logement", /loyer|foncia|nexity|century|orpi|syndic/i],
  ["sante", /pharmacie|docteur|dr\s|medecin|dentiste|labo|hopital|clinique/i],
  ["animaux", /veterinaire|veto|maxi\s*zoo|animalis|croquette/i],
  ["shopping", /amazon|fnac|darty|zalando|vinted|nike|adidas|decathlon|zara|h&m|boulanger|cdiscount|leroy merlin|ikea/i],
  ["loisirs", /cinema|ugc|pathe|gaumont|steam|nintendo|billetterie|concert|stade|fff|five|urban/i],
  ["salaire", /salaire|vir(ement)?\s+.*(paie|salaire)|remuneration/i],
];

const devinerCategorie = (libelle, montant) => {
  for (const [cat, re] of REGLES_CAT) if (re.test(libelle)) return cat;
  return montant > 0 ? "autresRevenus" : "autre";
};

// ---- Analyse du CSV ----
const detecterSeparateur = (ligne) => {
  const counts = { ";": (ligne.match(/;/g) || []).length, ",": (ligne.match(/,/g) || []).length, "\t": (ligne.match(/\t/g) || []).length };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const decouperLigne = (ligne, sep) => {
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

const lireMontant = (brut) => {
  if (!brut) return null;
  const nettoye = String(brut).replace(/\s|€|EUR/gi, "").replace(/\./g, (m, i, str) => (str.includes(",") ? "" : m)).replace(",", ".");
  const n = parseFloat(nettoye);
  return Number.isFinite(n) ? n : null;
};

const lireDate = (brut) => {
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

function analyserCSV(texte) {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length < 2) return { erreur: "Fichier vide ou illisible." };
  const sep = detecterSeparateur(lignes[0]);

  // Cherche la ligne d'en-tête (contenant "date")
  let idxEntete = lignes.findIndex((l) => /date/i.test(l));
  if (idxEntete === -1 || idxEntete > 5) idxEntete = 0;
  const entetes = decouperLigne(lignes[idxEntete], sep).map((e) => e.toLowerCase());

  const iDate = entetes.findIndex((e) => /date/.test(e));
  const iLibelle = entetes.findIndex((e) => /libell|label|description|designation|motif|nature|detail/.test(e));
  const iMontant = entetes.findIndex((e) => /montant|amount|^valeur/.test(e));
  const iDebit = entetes.findIndex((e) => /d[ée]bit/.test(e));
  const iCredit = entetes.findIndex((e) => /cr[ée]dit/.test(e));

  if (iDate === -1 || (iMontant === -1 && iDebit === -1)) {
    return { erreur: "Colonnes non reconnues. Le fichier doit contenir au moins une colonne Date et une colonne Montant (ou Débit/Crédit)." };
  }

  const operations = [];
  for (const ligne of lignes.slice(idxEntete + 1)) {
    const ch = decouperLigne(ligne, sep);
    const date = lireDate(ch[iDate]);
    if (!date) continue;
    let montant = null;
    if (iMontant !== -1) montant = lireMontant(ch[iMontant]);
    if (montant === null && iDebit !== -1) {
      const deb = lireMontant(ch[iDebit]);
      const cre = iCredit !== -1 ? lireMontant(ch[iCredit]) : null;
      if (deb) montant = -Math.abs(deb);
      else if (cre) montant = Math.abs(cre);
    }
    if (montant === null || montant === 0) continue;
    const libelle = (iLibelle !== -1 ? ch[iLibelle] : "").replace(/\s+/g, " ").trim() || "Import CSV";
    operations.push({ date, montant, libelle, categorie: devinerCategorie(libelle, montant) });
  }
  if (operations.length === 0) return { erreur: "Aucune opération valide trouvée dans le fichier." };
  return { operations };
}

export default function ImportCSV({ onFermer }) {
  const { comptes, transactions, soldes, categories, ajouterTransactionsLot, fusionnerTransactions } = useBudget();
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [resultat, setResultat] = useState(null); // { operations } | { erreur }
  const [selection, setSelection] = useState({});
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(null); // { ajouts, fusions }
  const [etapeRappro, setEtapeRappro] = useState(false);
  const fichierRef = useRef(null);

  const dejaImportees = useMemo(() => {
    const set = new Set();
    for (const t of transactions) set.add(`${t.date}|${t.montant.toFixed(2)}|${(t.libelle || "").toLowerCase()}`);
    return set;
  }, [transactions]);

  const chargerFichier = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const res = analyserCSV(String(lecteur.result));
      if (res.operations) {
        const sel = {};
        res.operations.forEach((o, i) => {
          const doublon = dejaImportees.has(`${o.date}|${o.montant.toFixed(2)}|${o.libelle.toLowerCase()}`);
          o.doublon = doublon;
          sel[i] = !doublon;
        });
        setSelection(sel);
      }
      setResultat(res);
    };
    lecteur.readAsText(f, "utf-8");
  };

  const changerCategorie = (i, cat) => {
    setResultat((r) => {
      const ops = [...r.operations];
      ops[i] = { ...ops[i], categorie: cat };
      return { operations: ops };
    });
  };

  // Étape 1 -> 2 : passer au rapprochement avec les opérations sélectionnées
  const versRapprochement = () => {
    setEtapeRappro(true);
  };

  const lignesSelectionnees = () =>
    resultat.operations
      .map((o, i) => ({ ...o, _i: i }))
      .filter((o) => selection[o._i])
      .map((o) => ({ montant: o.montant, categorie: o.categorie, libelle: o.libelle, date: o.date }));

  // Étape 2 : appliquer les décisions
  const appliquer = async (decisions) => {
    setEnCours(true);
    try {
      const ajouts = decisions
        .filter((d) => d.choix.action === "ajouter")
        .map((d) => ({
          compteId,
          montant: d.ligne.montant,
          categorie: d.ligne.categorie,
          libelle: d.ligne.libelle,
          date: d.ligne.date,
          importe: true,
        }));

      const fusions = decisions
        .filter((d) => d.choix.action === "fusionner" && d.choix.txId)
        .map((d) => ({ id: d.choix.txId, libelle: d.ligne.libelle, date: d.ligne.date }));

      if (ajouts.length > 0) await ajouterTransactionsLot(ajouts);
      if (fusions.length > 0) await fusionnerTransactions(fusions);

      setTermine({ ajouts: ajouts.length, fusions: fusions.length });
    } finally {
      setEnCours(false);
    }
  };

  const nbSelection = Object.values(selection).filter(Boolean).length;
  const cats = Object.entries(categories).filter(([, c]) => c.type !== "virement");

  return (
    <Sheet titre="Importer un relevé CSV" onFermer={onFermer}>
      {termine ? (
        <div className="py-8 text-center">
          <div className="text-4xl">✅</div>
          <p className="mt-2 font-semibold">Import terminé</p>
          <p className="mt-1 text-sm text-sourdine">
            {termine.ajouts > 0 && `${termine.ajouts} opération${termine.ajouts > 1 ? "s" : ""} ajoutée${termine.ajouts > 1 ? "s" : ""}`}
            {termine.ajouts > 0 && termine.fusions > 0 && " · "}
            {termine.fusions > 0 && `${termine.fusions} fusionnée${termine.fusions > 1 ? "s" : ""} (solde inchangé)`}
          </p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-encre py-3 font-semibold text-contraste">Fermer</button>
        </div>
      ) : etapeRappro ? (
        <Rapprochement
          lignes={lignesSelectionnees()}
          compteId={compteId}
          soldeActuel={soldes[compteId] || 0}
          onValider={appliquer}
          onRetour={() => setEtapeRappro(false)}
          enCours={enCours}
        />
      ) : !resultat?.operations ? (
        <div className="space-y-3">
          <p className="text-sm text-sourdine">
            Exporte un relevé au format CSV depuis l'espace client de ta banque (BNP, SG, Crédit Agricole, Boursorama, Revolut…), puis sélectionne le fichier. Les colonnes Date, Libellé et Montant (ou Débit/Crédit) sont détectées automatiquement.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Compte de destination</span>
            <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full rounded-ios border border-bordure bg-carte px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          {resultat?.erreur && <p className="rounded-2xl bg-corail-pale px-3 py-2 text-sm text-corail-texte">{resultat.erreur}</p>}
          <input ref={fichierRef} type="file" accept=".csv,text/csv,text/plain" onChange={chargerFichier} className="hidden" />
          <button onClick={() => fichierRef.current?.click()} disabled={!compteId} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40">
            Choisir le fichier CSV
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-sourdine">
            {resultat.operations.length} opérations détectées — vérifie les catégories, décoche ce que tu ne veux pas.
            {resultat.operations.some((o) => o.doublon) && " Les doublons probables sont décochés."}
          </p>
          <ul className="max-h-[45dvh] space-y-2 overflow-y-auto">
            {resultat.operations.map((o, i) => (
              <li key={i} className={`rounded-2xl bg-carte p-3 shadow-carte ${selection[i] ? "" : "opacity-45"}`}>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" checked={!!selection[i]} onChange={(e) => setSelection({ ...selection, [i]: e.target.checked })} className="h-5 w-5 shrink-0 accent-[#2BB68C]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{o.libelle}{o.doublon ? " · déjà présente ?" : ""}</div>
                    <div className="text-xs text-sourdine">{dateCourte(o.date)}</div>
                  </div>
                  <span className={`tnum shrink-0 text-sm font-bold ${o.montant > 0 ? "text-menthe" : ""}`}>
                    {o.montant > 0 ? "+" : ""}{euros(o.montant, { precis: true })}
                  </span>
                </div>
                <select
                  value={o.categorie}
                  onChange={(e) => changerCategorie(i, e.target.value)}
                  className="mt-2 w-full rounded-xl border border-bordure bg-fond px-2 py-1.5 text-sm outline-none"
                >
                  {cats.map(([id, c]) => <option key={id} value={id}>{c.icone} {c.label}</option>)}
                </select>
              </li>
            ))}
          </ul>
          <button onClick={versRapprochement} disabled={nbSelection === 0} className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40">
            Vérifier {nbSelection} opération{nbSelection > 1 ? "s" : ""} →
          </button>
        </div>
      )}
    </Sheet>
  );
}
