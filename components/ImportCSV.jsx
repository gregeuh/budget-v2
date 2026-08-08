"use client";

import { useMemo, useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, dateCourte } from "@/lib/format";
import Sheet from "./Sheet";
import { analyserCSV } from "@/lib/csv";
import { construireMemoire, devinerDepuisHistorique } from "@/lib/habitudes";
import { appliquerReglesAuto } from "@/lib/reglesAuto";
import PointsSautillants from "./PointsSautillants";
import Rapprochement from "./Rapprochement";

// ---- Catégorisation automatique par mots-clés (banques françaises) ----


// Transforme un libellé bancaire brut en nom lisible.
// "CB  SQ *FRAN'S VERDU 29/05/26" -> "Fran's Verdu" ; "PRLV SEPA Bouygues Telecom" -> "Bouygues Telecom"






// ---- Analyse du CSV ----










export default function ImportCSV({ onFermer }) {
  const { comptes, transactions, soldes, categories, profil, ajouterTransactionsLot, fusionnerTransactions, annulerImport } = useBudget();
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [resultat, setResultat] = useState(null); // { operations } | { erreur }
  const [selection, setSelection] = useState({});
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(null); // { ajouts, fusions }
  const [etapeRappro, setEtapeRappro] = useState(false);
  const [filtre, setFiltre] = useState("toutes");
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
        // Tes propres habitudes priment sur les règles génériques :
        // si tu as déjà classé "Carrefour" en Courses, l'import le fait aussi.
        const memoire = construireMemoire(transactions);
        for (const o of res.operations) {
          const regle = appliquerReglesAuto(o.libelle, profil.reglesAuto || [], categories);
          const appris = devinerDepuisHistorique(o.libelle, memoire);
          if (regle?.categorie) o.categorie = regle.categorie;
          else if (appris?.categorie && categories[appris.categorie]) o.categorie = appris.categorie;
          if (appris?.lieu && !o.lieu) o.lieu = appris.lieu;
          if (regle?.icone) o.icone = regle.icone;
          else if (appris?.icone && !o.icone) o.icone = appris.icone;
          o.appris = Boolean(regle || appris?.categorie || appris?.lieu || appris?.icone);
          // Une catégorie « Autre » non apprise mérite une décision explicite
          // avant de passer au rapprochement.
          o.aVerifier = !o.appris && o.categorie === "autre";
        }
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
      ops[i] = { ...ops[i], categorie: cat, aVerifier: false };
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
      .map((o) => ({ montant: o.montant, categorie: o.categorie, libelle: o.libelle, libelleBanque: o.libelleBanque, date: o.date, icone: o.icone, lieu: o.lieu }));

  // Étape 2 : appliquer les décisions
  const [lotId, setLotId] = useState(null);

  const appliquer = async (decisions) => {
    setEnCours(true);
    try {
      const id = `imp-${Date.now().toString(36)}`;
      const dateImport = new Date().toISOString();

      const ajouts = decisions
        .filter((d) => d.choix.action === "ajouter")
        .map((d) => ({
          compteId,
          montant: d.ligne.montant,
          categorie: d.ligne.categorie,
          libelle: d.ligne.libelle,
          date: d.ligne.date,
          ...(d.ligne.icone ? { icone: d.ligne.icone } : {}),
          ...(d.ligne.lieu ? { lieu: d.ligne.lieu } : {}),
          importe: true,
          lotImport: id,
          dateImport,
        }));

      const fusions = decisions
        .filter((d) => d.choix.action === "fusionner" && d.choix.txId)
        .map((d) => ({ id: d.choix.txId, libelle: d.ligne.libelle, date: d.ligne.date }));

      if (ajouts.length > 0) await ajouterTransactionsLot(ajouts);
      if (fusions.length > 0) await fusionnerTransactions(fusions, id);

      setLotId(id);
      setTermine({ ajouts: ajouts.length, fusions: fusions.length });
    } finally {
      setEnCours(false);
    }
  };

  const annuler = async () => {
    await annulerImport(lotId);
    onFermer();
  };

  const nbSelection = Object.values(selection).filter(Boolean).length;
  const cats = Object.entries(categories).filter(([, c]) => c.type !== "virement");
  const operations = resultat?.operations || [];
  const nbDoublons = operations.filter((o) => o.doublon).length;
  const nbAVerifier = operations.filter((o) => o.aVerifier).length;
  const nbApprises = operations.filter((o) => o.appris).length;
  const nbNouvelles = operations.length - nbDoublons;
  const operationsVisibles = operations
    .map((o, i) => ({ ...o, _i: i }))
    .filter((o) => filtre === "toutes" || filtre === "aVerifier" ? o.aVerifier || (filtre === "toutes") : filtre === "doublons" ? o.doublon : o.appris);

  const selectionnerNouvelles = () => {
    const prochaine = { ...selection };
    operations.forEach((o, i) => { prochaine[i] = !o.doublon; });
    setSelection(prochaine);
  };

  const toutDecocher = () => setSelection({});

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
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Parfait, fermer</button>
          <button onClick={annuler} className="mt-2 w-full rounded-ios bg-corail-pale py-2.5 text-sm font-semibold text-corail-texte">
            ↩️ Annuler cet import
          </button>
          <p className="mt-2 text-[11px] text-sourdine">
            L&apos;annulation supprime les {termine.ajouts} opération{termine.ajouts > 1 ? "s" : ""} ajoutée{termine.ajouts > 1 ? "s" : ""}
            {termine.fusions > 0 && ` et rétablit les ${termine.fusions} fusionnée${termine.fusions > 1 ? "s" : ""}`}. Tu peux aussi le faire plus tard depuis Réglages.
          </p>
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
            Exporte un relevé au format CSV depuis l'espace client de ta banque (LCL, BNP, SG, Crédit Agricole, Boursorama, Revolut…), puis sélectionne le fichier. Les colonnes Date, Libellé et Montant (ou Débit/Crédit) sont détectées automatiquement.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Compte de destination</span>
            <select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full champ px-3 py-3 outline-none">
              {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          {resultat?.erreur && <p className="rounded-2xl bg-corail-pale px-3 py-2 text-sm text-corail-texte">{resultat.erreur}</p>}
          <input ref={fichierRef} type="file" accept=".csv,text/csv,text/plain" onChange={chargerFichier} className="hidden" />
          <button onClick={() => fichierRef.current?.click()} disabled={!compteId} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-40">
            Choisir le fichier CSV
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-ios bg-fond p-3">
            <p className="text-sm font-semibold">Revue avant import</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-pill bg-carte px-2 py-1 font-medium">{operations.length} détectée{operations.length > 1 ? "s" : ""}</span>
              {nbApprises > 0 && <span className="rounded-pill bg-menthe-pale px-2 py-1 font-medium text-menthe-texte">✨ {nbApprises} reconnue{nbApprises > 1 ? "s" : ""}</span>}
              {nbAVerifier > 0 && <span className="rounded-pill bg-beurre-pale px-2 py-1 font-medium text-beurre-texte">⚠️ {nbAVerifier} à vérifier</span>}
              {nbDoublons > 0 && <span className="rounded-pill bg-corail-pale px-2 py-1 font-medium text-corail-texte">⛓️ {nbDoublons} doublon{nbDoublons > 1 ? "s" : ""}</span>}
            </div>
            <p className="mt-2 text-xs text-sourdine">
              {nbNouvelles} nouvelle{nbNouvelles > 1 ? "s" : ""} ligne{nbNouvelles > 1 ? "s" : ""} prête{nbNouvelles > 1 ? "s" : ""} à être ajoutée{nbNouvelles > 1 ? "s" : ""}. Les doublons probables sont décochés par sécurité et tes préférences mémorisées sont déjà appliquées.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[["toutes", "Toutes"], ["aVerifier", "À vérifier"], ["doublons", "Doublons"], ["apprises", "Reconnues"]].map(([id, label]) => (
              <button key={id} onClick={() => setFiltre(id)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${filtre === id ? "bg-encre text-contraste" : "bg-carte ring-1 ring-bordure"}`}>{label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={selectionnerNouvelles} className="flex-1 rounded-xl bg-menthe-pale py-2 text-xs font-semibold text-menthe-texte">Sélectionner les nouvelles</button>
            <button onClick={toutDecocher} className="rounded-xl bg-voile px-3 py-2 text-xs font-semibold text-sourdine">Tout décocher</button>
          </div>
          <ul className="max-h-[45dvh] space-y-2 overflow-y-auto">
            {operationsVisibles.map((o) => (
              <li key={o._i} className={`rounded-2xl bg-carte p-3 shadow-carte ${selection[o._i] ? "" : "opacity-45"}`}>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" checked={!!selection[o._i]} onChange={(e) => setSelection({ ...selection, [o._i]: e.target.checked })} className="h-5 w-5 shrink-0 accent-[var(--menthe)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{o.icone || ""} {o.libelle}</div>
                    <div className="text-xs text-sourdine">{dateCourte(o.date)}</div>
                  </div>
                  <span className={`tnum shrink-0 text-sm font-bold ${o.montant > 0 ? "text-menthe" : ""}`}>
                    {o.montant > 0 ? "+" : ""}{euros(o.montant, { precis: true })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  {o.appris && <span className="rounded-pill bg-menthe-pale px-2 py-1 text-menthe-texte">✨ Préférences mémorisées</span>}
                  {o.aVerifier && <span className="rounded-pill bg-beurre-pale px-2 py-1 text-beurre-texte">⚠️ Catégorie à confirmer</span>}
                  {o.doublon && <span className="rounded-pill bg-corail-pale px-2 py-1 text-corail-texte">⛓️ Doublon probable</span>}
                </div>
                <select
                  value={o.categorie}
                  onChange={(e) => changerCategorie(o._i, e.target.value)}
                  className="mt-2 w-full champ px-2 py-1.5 text-sm outline-none"
                >
                  {cats.map(([id, c]) => <option key={id} value={id}>{c.icone} {c.label}</option>)}
                </select>
              </li>
            ))}
          </ul>
          <button onClick={versRapprochement} disabled={nbSelection === 0} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-40">
            Vérifier {nbSelection} opération{nbSelection > 1 ? "s" : ""} →
          </button>
        </div>
      )}
    </Sheet>
  );
}
