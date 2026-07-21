"use client";

import { useState } from "react";
import PatrimoineChart from "./PatrimoineChart";
import SpendChart from "./SpendChart";
import DonutCat from "./DonutCat";
import CalendrierDepenses from "./CalendrierDepenses";

/**
 * Regroupe les visualisations dans un seul bloc dépliable.
 * L'accueil reste léger : on ouvre quand on veut creuser.
 */
export default function Analyses({ comptes, transactions, mois }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-voile text-base">📊</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Analyses</span>
          <span className="block text-xs text-sourdine">Patrimoine, dépenses, catégories, calendrier</span>
        </span>
        <span className={`text-sourdine/50 transition-transform ${ouvert ? "rotate-90" : ""}`}>›</span>
      </button>

      {ouvert && (
        <div className="fade-in mt-3 space-y-4 border-t border-bordure pt-3">
          <PatrimoineChart comptes={comptes} transactions={transactions} />
          <SpendChart transactions={transactions} />
          <DonutCat transactions={transactions} mois={mois} />
          <CalendrierDepenses mois={mois} />
        </div>
      )}
    </div>
  );
}
