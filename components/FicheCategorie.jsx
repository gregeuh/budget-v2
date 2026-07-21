"use client";

import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { euros, cleMoisLocal, moisDecaleLocal, dateCourte, toutesCategories } from "@/lib/format";
import Sheet from "./Sheet";
import TxRow from "./TxRow";

export default function FicheCategorie({ categorieId, onFermer }) {
  const { transactions, budgets } = useBudget();
  const cat = toutesCategories[categorieId] || toutesCategories.autre;

  const stats = useMemo(() => {
    const moisCourant = cleMoisLocal();
    const moisPrec = moisDecaleLocal(-1);
    let ce = 0, prec = 0;
    const liste = [];
    for (const t of transactions) {
      if (t.categorie !== categorieId || t.versId || t.horsSolde) continue;
      const val = Math.abs(t.montant);
      const m = t.date.slice(0, 7);
      if (m === moisCourant) { ce += val; liste.push(t); }
      else if (m === moisPrec) prec += val;
    }
    liste.sort((a, b) => b.date.localeCompare(a.date));
    return { ce, prec, liste, delta: ce - prec };
  }, [transactions, categorieId]);

  const budget = budgets?.[categorieId] || 0;
  const pct = budget > 0 ? Math.min(100, (stats.ce / budget) * 100) : 0;
  const depasse = budget > 0 && stats.ce > budget;

  return (
    <Sheet titre={cat.label} onFermer={onFermer}>
      <div className="space-y-3">
        {/* En-tête façon Wallet */}
        <div className="rounded-ios bg-carte p-4 text-center shadow-carte">
          <span className="text-4xl">{cat.icone}</span>
          <p className="chiffres mt-2 text-3xl font-bold">{euros(stats.ce)}</p>
          <p className="text-sm text-sourdine">ce mois-ci</p>
          {stats.prec > 0 && (
            <p className={`mt-1 text-xs font-medium ${stats.delta > 0 ? "text-corail" : "text-menthe"}`}>
              {stats.delta > 0 ? "▲" : "▼"} {euros(Math.abs(stats.delta))} vs mois dernier ({euros(stats.prec)})
            </p>
          )}
        </div>

        {/* Budget si défini */}
        {budget > 0 && (
          <div className="rounded-ios bg-carte p-3.5 shadow-carte">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Budget mensuel</span>
              <span className={`tnum font-semibold ${depasse ? "text-corail" : ""}`}>{euros(stats.ce)} / {euros(budget)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-voile">
              <div className="jauge-in h-full rounded-full transition-all" style={{ width: `${pct}%`, background: depasse ? "var(--corail)" : "var(--menthe)" }} />
            </div>
            <p className="mt-1 text-xs text-sourdine">
              {depasse ? `Dépassé de ${euros(stats.ce - budget)}` : `Reste ${euros(budget - stats.ce)}`}
            </p>
          </div>
        )}

        {/* Opérations */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">
            {stats.liste.length} opération{stats.liste.length > 1 ? "s" : ""} ce mois-ci
          </h3>
          {stats.liste.length === 0 ? (
            <p className="rounded-ios bg-carte p-4 text-center text-sm text-sourdine shadow-carte">
              Aucune opération dans cette catégorie ce mois-ci.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.liste.map((t, i) => <TxRow key={t.id} tx={t} retard={i} avecCompte />)}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
