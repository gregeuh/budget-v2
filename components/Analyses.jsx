"use client";

import { useState } from "react";
import Tendances from "./Tendances";
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
    <section className="overflow-hidden rounded-v3-m bg-ui-surface-floating shadow-v3-soft">
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-v3-xs bg-marque-pale text-xl">⌁</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Vue analytique</span>
          <span className="mt-0.5 block text-v3-caption text-ui-text-secondary">Tendances, patrimoine, catégories et calendrier</span>
        </span>
        <span className={`text-ui-text-secondary transition-transform duration-v3-normal ${ouvert ? "rotate-90" : ""}`}>›</span>
      </button>

      {ouvert && (
        <div className="fade-in space-y-5 border-t border-ui-hairline px-4 pb-4 pt-4">
          <Tendances />
          <PatrimoineChart comptes={comptes} transactions={transactions} />
          <SpendChart transactions={transactions} />
          <DonutCat transactions={transactions} mois={mois} />
          <CalendrierDepenses mois={mois} />
        </div>
      )}
    </section>
  );
}
