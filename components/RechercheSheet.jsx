"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros } from "@/lib/format";
import { rechercher } from "@/lib/recherche";
import Sheet from "./Sheet";
import TxRow from "./TxRow";

export default function RechercheSheet({ onFermer }) {
  const { transactions, comptes, categoriesPerso } = useBudget();
  const [q, setQ] = useState("");

  const resultats = useMemo(
    () => rechercher(q, transactions, comptes, categoriesPerso),
    [q, transactions, comptes, categoriesPerso]
  );

  const total = useMemo(() => {
    let depenses = 0, revenus = 0;
    for (const t of resultats) {
      if (t.montant > 0) revenus += t.montant;
      else depenses += -t.montant;
    }
    return { depenses, revenus, nb: resultats.length };
  }, [resultats]);

  const suggestions = ["Carrefour", "Apple", "> 100", "Courses", "revenu"];

  return (
    <Sheet titre="Rechercher" onFermer={onFermer}>
      <div className="space-y-3">
        {/* Champ de recherche */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sourdine">🔍</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Commerçant, montant (>50), catégorie, lieu…"
            className="w-full rounded-pill border border-bordure bg-carte py-2.5 pl-10 pr-9 text-sm outline-none focus:border-menthe"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Effacer" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-voile text-xs text-sourdine">
              ✕
            </button>
          )}
        </div>

        {/* Suggestions rapides */}
        {!q && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="rounded-pill bg-voile px-2.5 py-1.5 text-[13px] font-medium">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Récap des résultats */}
        {q && (
          <div className="tnum flex items-center justify-between rounded-ios bg-carte px-3.5 py-2.5 text-sm shadow-carte">
            <span className="font-semibold">{total.nb} résultat{total.nb > 1 ? "s" : ""}</span>
            <span className="text-sourdine">
              {total.depenses > 0 && <span className="text-corail">−{euros(total.depenses)}</span>}
              {total.depenses > 0 && total.revenus > 0 && " · "}
              {total.revenus > 0 && <span className="text-menthe">+{euros(total.revenus)}</span>}
            </span>
          </div>
        )}

        {/* Résultats */}
        {q && resultats.length === 0 ? (
          <p className="rounded-ios bg-carte p-6 text-center text-sm text-sourdine shadow-carte">
            Aucune opération trouvée pour « {q} ».
          </p>
        ) : (
          <ul className="space-y-2">
            {resultats.slice(0, 60).map((tx, i) => <TxRow key={tx.id} tx={tx} retard={i} avecCompte />)}
          </ul>
        )}
        {resultats.length > 60 && (
          <p className="text-center text-xs text-sourdine">Affinez votre recherche pour voir moins de résultats ({resultats.length} au total).</p>
        )}
      </div>
    </Sheet>
  );
}
