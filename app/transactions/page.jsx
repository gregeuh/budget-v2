"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useBudget } from "@/lib/store";
import { cleMois, euros, aujourdhui, dateCourte } from "@/lib/format";
import { calculerProjection } from "@/lib/projection";
import { statsMois } from "@/lib/conseils";
import TxRow from "@/components/TxRow";
import Sheet from "@/components/Sheet";
import EtatVide from "@/components/EtatVide";
import { rechercher } from "@/lib/recherche";
import CalendrierFinancier from "@/components/CalendrierFinancier";

const ImportCSV = dynamic(() => import("@/components/ImportCSV"), { ssr: false });

export default function Transactions() {
  const { transactions, comptes, categories, recurrentes, soldes, profil } = useBudget();
  const [compteId, setCompteId] = useState("tous");
  const [catFiltre, setCatFiltre] = useState("toutes");
  const [importOuvert, setImportOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [periode, setPeriode] = useState("tout");
  const [typeFiltre, setTypeFiltre] = useState("tous");
  const [montantMin, setMontantMin] = useState("");
  const [recurrenteEdition, setRecurrenteEdition] = useState(null);

  const filtresActifs = catFiltre !== "toutes" || periode !== "tout" || typeFiltre !== "tous" || Boolean(montantMin.trim());
  const debutPeriode = useMemo(() => {
    const aujourd = new Date(`${aujourdhui()}T12:00:00`);
    if (periode === "mois") return `${aujourdhui().slice(0, 7)}-01`;
    if (periode === "3mois") {
      aujourd.setMonth(aujourd.getMonth() - 2);
      return `${aujourd.getFullYear()}-${String(aujourd.getMonth() + 1).padStart(2, "0")}-01`;
    }
    return null;
  }, [periode]);

  const effacerFiltres = () => {
    setCompteId("tous");
    setCatFiltre("toutes");
    setPeriode("tout");
    setTypeFiltre("tous");
    setMontantMin("");
    setRecherche("");
  };

  const appliquerRaccourci = (id) => {
    setRecherche("");
    if (id === "tout") {
      setPeriode("tout");
      setTypeFiltre("tous");
      return;
    }
    if (id === "mois") {
      setPeriode("mois");
      setTypeFiltre("tous");
      return;
    }
    setPeriode("tout");
    setTypeFiltre(id);
  };

  const parMois = useMemo(() => {
    const seuil = Number(String(montantMin).replace(",", "."));
    const base = recherche.trim() ? rechercher(recherche, transactions, comptes) : transactions;
    const filtrees = base.filter((t) => {
      if (compteId !== "tous" && t.compteId !== compteId && t.versId !== compteId) return false;
      if (catFiltre !== "toutes" && t.categorie !== catFiltre) return false;
      if (debutPeriode && t.date < debutPeriode) return false;
      if (typeFiltre === "depenses" && t.montant >= 0) return false;
      if (typeFiltre === "revenus" && t.montant <= 0) return false;
      if (Number.isFinite(seuil) && seuil > 0 && Math.abs(t.montant) < seuil) return false;
      return true;
    });
    const groupes = {};
    for (const t of filtrees.filter((t) => t.date <= aujourdhui())) {
      const m = cleMois(t.date);
      (groupes[m] = groupes[m] || []).push(t);
    }
    return Object.entries(groupes)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([mois, txs]) => ({ mois, txs: txs.sort((a, b) => b.date.localeCompare(a.date)) }));
  }, [transactions, compteId, catFiltre, recherche, comptes, debutPeriode, typeFiltre, montantMin]);

  const catsPresentes = useMemo(() => {
    const set = new Set(transactions.map((t) => t.categorie));
    return Object.entries(categories).filter(([id]) => set.has(id));
  }, [transactions, categories]);

  // Bilan de la recherche
  const bilan = useMemo(() => {
    if (!recherche.trim() && !filtresActifs) return null;
    let nb = 0, depense = 0, recu = 0;
    for (const { txs } of parMois) {
      for (const t of txs) {
        nb++;
        if (t.versId || t.categorie === "virement" || t.categorie === "ajustement") continue;
        if (t.montant < 0) depense += -t.montant;
        else recu += t.montant;
      }
    }
    return { nb, depense, recu };
  }, [parMois, recherche, filtresActifs]);

  const [astuce, setAstuce] = useState(false);
  useEffect(() => {
    try { setAstuce(!localStorage.getItem("astuce-swipe")); } catch {}
  }, []);
  useEffect(() => {
    const categorieDemandee = new URLSearchParams(window.location.search).get("categorie");
    if (categorieDemandee && categories[categorieDemandee]) setCatFiltre(categorieDemandee);
  }, [categories]);
  const fermerAstuce = () => {
    setAstuce(false);
    try { localStorage.setItem("astuce-swipe", "1"); } catch {}
  };

  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const { salaireISO, aVenir } = projection;
  const pointBas = useMemo(
    () => projection.evolution.reduce((min, point) => point.solde < min.solde ? point : min, projection.evolution[0] || { solde: projection.dispo, date: aujourdhui() }),
    [projection]
  );
  const prochaineSortie = useMemo(() => aVenir.find((t) => t.montant < 0), [aVenir]);

  const aVenirAffiche = useMemo(
    () => aVenir.filter((t) => compteId === "tous" || t.compteId === compteId || t.versId === compteId),
    [aVenir, compteId]
  );

  const nomMois = (m) => {
    const s = new Date(m + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between px-1">
        <div><p className="text-v3-caption font-medium text-ui-text-secondary">Suivi en temps réel</p><h1 className="text-v3-title font-semibold">Opérations</h1></div>
        <button onClick={() => setImportOuvert(true)} className="tappable rounded-pill bg-marque-bouton px-4 py-2.5 text-sm font-semibold text-surMarque shadow-bouton">Importer</button>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        <button
          onClick={() => setCompteId("tous")}
          aria-pressed={compteId === "tous"}
          className={`shrink-0 rounded-pill border px-3 py-2 text-sm font-medium transition-all duration-v3-normal ${compteId === "tous" ? "border-ui-primary bg-ui-primary text-white shadow-v3-soft" : "border-ui-hairline bg-ui-surface-floating text-ui-text-secondary"}`}
        >
          Tous les comptes
        </button>
        {comptes.map((c) => (
          <button
            key={c.id}
            onClick={() => setCompteId(c.id)}
            aria-pressed={compteId === c.id}
            className={`shrink-0 rounded-pill border px-3 py-2 text-sm font-medium transition-all duration-v3-normal ${compteId === c.id ? "border-ui-primary bg-ui-primary text-white shadow-v3-soft" : "border-ui-hairline bg-ui-surface-floating text-ui-text-secondary"}`}
          >
            {c.nom}
          </button>
        ))}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sourdine">🔍</span>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Rechercher (Carrefour, Netflix, courses…)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full champ champ-pill bg-ui-surface-floating py-3 pl-10 pr-9 text-sm outline-none shadow-v3-soft"
        />
        {recherche && (
          <button onClick={() => setRecherche("")} aria-label="Effacer" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-voile text-xs text-sourdine">✕</button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFiltresOuverts((ouvert) => !ouvert)}
          aria-expanded={filtresOuverts}
          aria-controls="filtres-transactions"
          className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-ios border px-3.5 py-2.5 text-sm font-semibold transition ${filtresActifs ? "border-marque bg-marque-pale text-marque-texte" : "border-bordure bg-carte"}`}
        >
          <span className="truncate">☷ Filtres avancés</span>
          <span className="shrink-0 text-xs">{filtresOuverts ? "Masquer" : filtresActifs ? "Actifs" : "Afficher"}</span>
        </button>
        {(recherche || filtresActifs || compteId !== "tous") && (
          <button onClick={effacerFiltres} className="rounded-ios bg-voile px-3 py-2.5 text-xs font-semibold text-sourdine">Réinitialiser</button>
        )}
      </div>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" aria-label="Raccourcis de recherche">
        {[
          ["tout", "Tout"],
          ["mois", "Ce mois"],
          ["depenses", "Dépenses"],
          ["revenus", "Revenus"],
        ].map(([id, label]) => {
          const actif = id === "tout"
            ? periode === "tout" && typeFiltre === "tous"
            : id === "mois" ? periode === "mois" && typeFiltre === "tous" : typeFiltre === id && periode === "tout";
          return (
            <button
              key={id}
              type="button"
              onClick={() => appliquerRaccourci(id)}
              aria-pressed={actif}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${actif ? "bg-encre text-contraste" : "bg-carte text-sourdine ring-1 ring-bordure"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtresOuverts && (
        <div id="filtres-transactions" className="fade-in space-y-3 rounded-v3-m border border-bordure bg-carte p-3.5 shadow-carte">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sourdine">Période</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[["mois", "Ce mois"], ["3mois", "3 mois"], ["tout", "Tout"]].map(([id, label]) => (
                <button key={id} onClick={() => setPeriode(id)} aria-pressed={periode === id} className={`rounded-pill px-2 py-2 text-xs font-semibold ${periode === id ? "bg-encre text-contraste" : "bg-fond text-sourdine"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sourdine">Type</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[["tous", "Tous"], ["depenses", "Dépenses"], ["revenus", "Revenus"]].map(([id, label]) => (
                <button key={id} onClick={() => setTypeFiltre(id)} aria-pressed={typeFiltre === id} className={`rounded-pill px-2 py-2 text-xs font-semibold ${typeFiltre === id ? "bg-encre text-contraste" : "bg-fond text-sourdine"}`}>{label}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sourdine">Montant minimum</span>
            <div className="champ flex items-center px-3">
              <span className="text-sourdine">≥</span>
              <input inputMode="decimal" enterKeyHint="done" value={montantMin} onChange={(e) => setMontantMin(e.target.value)} placeholder="Ex. 50" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
              <span className="text-sm text-sourdine">€</span>
            </div>
          </label>
          <p className="text-[11px] text-sourdine">La recherche comprend aussi le lieu, le compte, le libellé de la banque et les requêtes comme « &gt;50 » ou « dépense ».</p>
        </div>
      )}

      {/* Filtre par catégorie */}
      {catsPresentes.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <button
            onClick={() => setCatFiltre("toutes")}
            className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold ${catFiltre === "toutes" ? "bg-encre text-contraste" : "bg-carte text-sourdine ring-1 ring-bordure"}`}
          >
            Toutes
          </button>
          {catsPresentes.map(([id, c]) => (
            <button
              key={id}
              onClick={() => setCatFiltre(catFiltre === id ? "toutes" : id)}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold ${catFiltre === id ? "bg-encre text-contraste" : "bg-carte text-sourdine ring-1 ring-bordure"}`}
            >
              {c.icone} {c.label}
            </button>
          ))}
        </div>
      )}

      {bilan && bilan.nb > 0 && (
        <div className="tnum rounded-ios bg-carte px-4 py-2.5 text-sm shadow-carte">
          <span className="font-semibold">{bilan.nb} opération{bilan.nb > 1 ? "s" : ""}</span>
          {bilan.depense > 0 && <span className="text-sourdine"> · <span className="font-semibold text-corail">{euros(bilan.depense)}</span> dépensés</span>}
          {bilan.recu > 0 && <span className="text-sourdine"> · <span className="font-semibold text-menthe">{euros(bilan.recu)}</span> reçus</span>}
        </div>
      )}

      {/* Reste à vivre projeté */}
      {!recherche && !filtresActifs && (
        <div className={`relative overflow-hidden rounded-v3-m p-4 sm:p-5 text-white shadow-v3-medium ${projection.reste < 0 ? "bg-[linear-gradient(145deg,var(--corail),var(--corail-bouton))]" : "bg-[linear-gradient(145deg,var(--marque),var(--marque-texte))]"}`}>
          <div className="reflet opacity-60" />
          <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/75">Reste à vivre</h2>
              <p className="mt-0.5 text-xs font-medium text-white/65">{salaireISO ? `Jusqu’au salaire · ${dateCourte(salaireISO)}` : "Projection sur 30 jours"}</p>
            </div>
            <span className="shrink-0 rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">{projection.jours} j</span>
          </div>
          <div className="chiffres mt-2 text-4xl font-bold">
            {euros(projection.reste)}
          </div>
          <p className="tnum mt-2 text-xs text-white/75">
            {euros(projection.dispo)} dispo
            {projection.prevu > 0 && ` − ${euros(projection.prevu)} prévus`}
            {projection.attendu > 0 && ` + ${euros(projection.attendu)} attendus`}
            {" "}· ~{euros(projection.reste / projection.jours)} / jour
          </p>
          {!salaireISO && (
            <p className="mt-2 text-xs text-white/75">Renseigne ton jour de salaire dans ⚙️ → Mon profil pour caler la projection sur ta paie.</p>
          )}
          {(prochaineSortie || pointBas.solde < projection.dispo) && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/20 pt-3 text-xs">
              <span><span className="block text-white/60">Prochaine sortie</span><strong className="block truncate">{prochaineSortie ? `${prochaineSortie.libelle} · ${euros(Math.abs(prochaineSortie.montant))}` : "Aucune prévue"}</strong></span>
              <span><span className="block text-white/60">Point bas prévu</span><strong className="block">{euros(pointBas.solde)} · {dateCourte(pointBas.date)}</strong></span>
            </div>
          )}
          </div>
        </div>
      )}

      {!recherche && !filtresActifs && <CalendrierFinancier projection={projection} categories={categories} />}

      {/* À venir */}
      {!recherche && !filtresActifs && aVenirAffiche.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">À venir</h2>
          <ul className="space-y-2">
            {aVenirAffiche.map((t, i) =>
              t.virtuel ? (
                <li
                  key={t.id}
                  onClick={() => setRecurrenteEdition(recurrentes.find((r) => r.id === t.recurrenteId) || null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setRecurrenteEdition(recurrentes.find((r) => r.id === t.recurrenteId) || null);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Gérer l'opération à venir ${t.libelle}`}
                  className="tappable pop-in flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-bordure bg-carte/50 px-3 py-2 opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marque"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fond text-base">
                    {(categories[t.categorie] || categories.autre).icone}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.libelle}</span>
                    <span className="block text-xs text-sourdine">{dateCourte(t.date)} · 🔁 prévu</span>
                  </span>
                  <span className={`tnum shrink-0 text-sm font-bold ${t.montant > 0 ? "text-menthe" : "text-corail-texte"}`}>
                    {t.montant > 0 ? "+" : ""}{euros(t.montant, { precis: true })}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRecurrenteEdition(recurrentes.find((r) => r.id === t.recurrenteId) || null); }}
                    aria-label={`Gérer la récurrence ${t.libelle}`}
                    className="tappable -mr-1 flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-lg text-sourdine hover:bg-voile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marque"
                  >
                    ⋯
                  </button>
                </li>
              ) : (
                <TxRow key={t.id} tx={t} avecCompte={compteId === "tous"} retard={i} />
              )
            )}
          </ul>
        </section>
      )}

      {parMois.length > 0 && !recherche && !filtresActifs && (
        <div className="flex items-baseline justify-between">
          <h2 className="!mb-0 text-sm font-semibold uppercase tracking-wide text-sourdine">Passées</h2>
          <button onClick={fermerAstuce} className="text-right text-[11px] font-medium text-sourdine">
            {astuce ? "Touchez ⋯ pour modifier · glissez pour supprimer · OK" : "⋯ Modifier · glisser pour supprimer"}
          </button>
        </div>
      )}

      {parMois.length === 0 && (
        <EtatVide
          icone={recherche || filtresActifs || compteId !== "tous" ? "🔎" : "📥"}
          titre={recherche ? "Aucun résultat" : filtresActifs || compteId !== "tous" ? "Aucune opération ici" : "Commence ton suivi"}
          description={recherche ? `Aucune opération ne correspond à « ${recherche} ».` : filtresActifs || compteId !== "tous" ? "Modifie tes filtres ou reviens à tous les comptes pour retrouver tes opérations." : "Importe un relevé bancaire pour retrouver ton historique en quelques secondes."}
          actionLabel={recherche || filtresActifs || compteId !== "tous" ? "Réinitialiser les filtres" : "Importer un relevé"}
          onAction={recherche || filtresActifs || compteId !== "tous" ? effacerFiltres : () => setImportOuvert(true)}
        />
      )}

      {parMois.map(({ mois, txs }) => {
        const s = statsMois(txs, mois);
        return (
          <section key={mois}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">{nomMois(mois)}</h2>
              <span className={`tnum text-sm font-semibold ${s.solde >= 0 ? "text-menthe" : "text-corail"}`}>
                {s.solde >= 0 ? "+" : ""}{euros(s.solde)}
              </span>
            </div>
            <ul className="space-y-2">
              {txs.map((t, i) => <TxRow key={t.id} tx={t} avecCompte={compteId === "tous"} retard={i} />)}
            </ul>
          </section>
        );
      })}
      {importOuvert && <ImportCSV onFermer={() => setImportOuvert(false)} />}
      {recurrenteEdition && <RecurrenteEdition recurrence={recurrenteEdition} onFermer={() => setRecurrenteEdition(null)} />}
    </div>
  );
}

function RecurrenteEdition({ recurrence, onFermer }) {
  const { comptes, categories, modifierRecurrente, supprimerRecurrente } = useBudget();
  const [libelle, setLibelle] = useState(recurrence.libelle || "");
  const [montant, setMontant] = useState(String(Math.abs(recurrence.montant)).replace(".", ","));
  const [sens, setSens] = useState(recurrence.montant < 0 ? "depense" : "revenu");
  const [categorie, setCategorie] = useState(recurrence.categorie);
  const [compteId, setCompteId] = useState(recurrence.compteId);
  const [date, setDate] = useState(recurrence.prochaine);
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);
  const cats = Object.entries(categories).filter(([, cat]) => sens === "revenu" ? cat.type === "revenu" : cat.type !== "revenu" && cat.type !== "virement");

  const enregistrer = async () => {
    const valeur = Number(String(montant).replace(",", "."));
    if (!valeur || valeur <= 0) return;
    await modifierRecurrente(recurrence.id, {
      libelle: libelle.trim() || "Opération récurrente",
      montant: sens === "depense" ? -valeur : valeur,
      compteId,
      categorie,
      prochaine: date,
    });
    onFermer();
  };

  return (
    <Sheet titre="Gérer l'opération à venir" onFermer={onFermer} niveau={2}>
      <div className="space-y-3">
        <p className="rounded-ios bg-marque-pale px-3.5 py-2.5 text-sm text-marque-texte">🔁 Cette opération est générée par une récurrence. Tes changements s'appliqueront aux prochaines occurrences.</p>
        <div className="grid grid-cols-2 rounded-pill bg-voile p-1">
          {[['depense', 'Dépense'], ['revenu', 'Revenu']].map(([id, label]) => <button key={id} onClick={() => setSens(id)} className={`rounded-pill py-2 text-sm font-semibold ${sens === id ? 'bg-carte shadow-carte' : 'text-sourdine'}`}>{label}</button>)}
        </div>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Libellé</span><input value={libelle} onChange={(e) => setLibelle(e.target.value)} className="w-full champ px-3 py-3 outline-none" /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Montant</span><div className="champ flex items-center px-3"><input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" /><span className="text-sourdine">€</span></div></label>
        <div className="flex flex-wrap gap-1.5">{cats.map(([id, cat]) => <button key={id} onClick={() => setCategorie(id)} className={`rounded-pill border px-2.5 py-1.5 text-xs font-semibold ${categorie === id ? 'border-encre bg-encre text-contraste' : 'border-bordure bg-carte'}`}>{cat.icone} {cat.label}</button>)}</div>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Compte</span><select value={compteId} onChange={(e) => setCompteId(e.target.value)} className="w-full champ px-3 py-3 outline-none">{comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sourdine">Prochaine date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full champ px-3 py-3 outline-none" /></label>
        </div>
        <button onClick={enregistrer} className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Enregistrer</button>
        <button onClick={async () => { if (!confirmeSuppr) return setConfirmeSuppr(true); await supprimerRecurrente(recurrence.id); onFermer(); }} className={`w-full rounded-ios py-3 text-sm font-semibold ${confirmeSuppr ? 'bg-corail-bouton text-white' : 'text-corail'}`}>{confirmeSuppr ? 'Confirmer la suppression de la récurrence' : 'Supprimer la récurrence'}</button>
      </div>
    </Sheet>
  );
}
