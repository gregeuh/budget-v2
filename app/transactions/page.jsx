"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { cleMois, euros, aujourdhui, dateCourte } from "@/lib/format";
import { calculerProjection } from "@/lib/projection";
import { statsMois } from "@/lib/conseils";
import TxRow from "@/components/TxRow";
import ImportCSV from "@/components/ImportCSV";

export default function Transactions() {
  const { transactions, comptes, categories, recurrentes, soldes, profil } = useBudget();
  const [compteId, setCompteId] = useState("tous");
  const [catFiltre, setCatFiltre] = useState("toutes");
  const [importOuvert, setImportOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");

  const normaliser = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const parMois = useMemo(() => {
    const q = normaliser(recherche.trim());
    const filtrees = transactions.filter((t) => {
      if (compteId !== "tous" && t.compteId !== compteId && t.versId !== compteId) return false;
      if (catFiltre !== "toutes" && t.categorie !== catFiltre) return false;
      if (!q) return true;
      const cat = categories[t.categorie] || categories.autre;
      return normaliser(t.libelle).includes(q) || normaliser(cat.label).includes(q);
    });
    const groupes = {};
    for (const t of filtrees.filter((t) => t.date <= aujourdhui())) {
      const m = cleMois(t.date);
      (groupes[m] = groupes[m] || []).push(t);
    }
    return Object.entries(groupes)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([mois, txs]) => ({ mois, txs: txs.sort((a, b) => b.date.localeCompare(a.date)) }));
  }, [transactions, compteId, catFiltre, recherche, categories]);

  const catsPresentes = useMemo(() => {
    const set = new Set(transactions.map((t) => t.categorie));
    return Object.entries(categories).filter(([id]) => set.has(id));
  }, [transactions, categories]);

  // Bilan de la recherche
  const bilan = useMemo(() => {
    if (!recherche.trim()) return null;
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
  }, [parMois, recherche]);

  const [astuce, setAstuce] = useState(false);
  useEffect(() => {
    try { setAstuce(!localStorage.getItem("astuce-swipe")); } catch {}
  }, []);
  const fermerAstuce = () => {
    setAstuce(false);
    try { localStorage.setItem("astuce-swipe", "1"); } catch {}
  };

  const projection = useMemo(
    () => calculerProjection({ comptes, soldes, transactions, recurrentes, profil }),
    [comptes, soldes, transactions, recurrentes, profil]
  );
  const { salaireISO, aVenir } = projection;

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
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Opérations</h1>
        <button onClick={() => setImportOuvert(true)} className="rounded-pill bg-encre px-4 py-2 text-sm font-semibold text-contraste">
          ⬇︎ Importer CSV
        </button>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        <button
          onClick={() => setCompteId("tous")}
          className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium ${compteId === "tous" ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
        >
          Tous les comptes
        </button>
        {comptes.map((c) => (
          <button
            key={c.id}
            onClick={() => setCompteId(c.id)}
            className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium ${compteId === c.id ? "border-encre bg-encre text-contraste" : "border-bordure bg-carte"}`}
          >
            {c.nom}
          </button>
        ))}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sourdine">🔍</span>
        <input
          type="search"
          placeholder="Rechercher (Carrefour, Netflix, courses…)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full rounded-pill border border-bordure bg-carte py-2.5 pl-10 pr-9 text-sm outline-none focus:border-menthe"
        />
        {recherche && (
          <button onClick={() => setRecherche("")} aria-label="Effacer" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-voile text-xs text-sourdine">✕</button>
        )}
      </div>

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
      {!recherche && (
        <div className="rounded-ios bg-carte p-3.5 shadow-carte">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sourdine">
              💼 Reste à vivre
              <span className="ml-1.5 font-medium text-sourdine">
                {salaireISO ? `jusqu'au salaire (${dateCourte(salaireISO)})` : "sur 30 jours"}
              </span>
            </h2>
            <span className="text-xs text-sourdine">{projection.jours} j</span>
          </div>
          <div className={`chiffres mt-1 text-3xl font-bold ${projection.reste < 0 ? "text-corail" : ""}`}>
            {euros(projection.reste)}
          </div>
          <p className="tnum mt-1 text-xs text-sourdine">
            {euros(projection.dispo)} dispo
            {projection.prevu > 0 && ` − ${euros(projection.prevu)} prévus`}
            {projection.attendu > 0 && ` + ${euros(projection.attendu)} attendus`}
            {" "}· ~{euros(projection.reste / projection.jours)} / jour
          </p>
          {!salaireISO && (
            <p className="mt-1.5 text-xs text-sourdine">Renseigne ton jour de salaire dans ⚙️ → Mon profil pour caler la projection sur ta paie.</p>
          )}
        </div>
      )}

      {/* À venir */}
      {!recherche && aVenirAffiche.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">À venir</h2>
          <ul className="space-y-2">
            {aVenirAffiche.map((t, i) =>
              t.virtuel ? (
                <li
                  key={t.id}
                  className="pop-in flex items-center gap-3 rounded-2xl border border-dashed border-bordure bg-carte/50 px-3 py-2 opacity-75"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fond text-base">
                    {(categories[t.categorie] || categories.autre).icone}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.libelle}</span>
                    <span className="block text-xs text-sourdine">{dateCourte(t.date)} · 🔁 prévu</span>
                  </span>
                  <span className={`tnum shrink-0 text-sm font-bold ${t.montant > 0 ? "text-menthe" : "text-encre"}`}>
                    {t.montant > 0 ? "+" : ""}{euros(t.montant, { precis: true })}
                  </span>
                </li>
              ) : (
                <TxRow key={t.id} tx={t} avecCompte={compteId === "tous"} retard={i} />
              )
            )}
          </ul>
        </section>
      )}

      {parMois.length > 0 && !recherche && (
        <div className="flex items-baseline justify-between">
          <h2 className="!mb-0 text-sm font-semibold uppercase tracking-wide text-sourdine">Passées</h2>
          {astuce && (
            <button onClick={fermerAstuce} className="text-[11px] font-medium text-sourdine">
              👈 Glisse une ligne pour supprimer · OK
            </button>
          )}
        </div>
      )}

      {parMois.length === 0 && (
        <p className="rounded-ios bg-carte p-6 text-center text-sm text-sourdine shadow-carte">
          {recherche ? `Aucune opération ne correspond à « ${recherche} ».` : "Aucune opération à afficher."}
        </p>
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
    </div>
  );
}
