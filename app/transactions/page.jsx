"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { cleMois, euros } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import TxRow from "@/components/TxRow";
import ImportCSV from "@/components/ImportCSV";

export default function Transactions() {
  const { transactions, comptes, categories } = useBudget();
  const [compteId, setCompteId] = useState("tous");
  const [importOuvert, setImportOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");

  const normaliser = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const parMois = useMemo(() => {
    const q = normaliser(recherche.trim());
    const filtrees = transactions.filter((t) => {
      if (compteId !== "tous" && t.compteId !== compteId && t.versId !== compteId) return false;
      if (!q) return true;
      const cat = categories[t.categorie] || categories.autre;
      return normaliser(t.libelle).includes(q) || normaliser(cat.label).includes(q);
    });
    const groupes = {};
    for (const t of filtrees) {
      const m = cleMois(t.date);
      (groupes[m] = groupes[m] || []).push(t);
    }
    return Object.entries(groupes)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([mois, txs]) => ({ mois, txs: txs.sort((a, b) => b.date.localeCompare(a.date)) }));
  }, [transactions, compteId, recherche]);

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

  const nomMois = (m) => {
    const s = new Date(m + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Opérations</h1>
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

      {bilan && bilan.nb > 0 && (
        <div className="tnum rounded-ios bg-ciel-pale px-4 py-2.5 text-sm font-medium text-ciel-texte">
          {bilan.nb} opération{bilan.nb > 1 ? "s" : ""}
          {bilan.depense > 0 && ` · ${euros(bilan.depense)} dépensés`}
          {bilan.recu > 0 && ` · ${euros(bilan.recu)} reçus`}
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
