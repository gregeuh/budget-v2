"use client";

import { useBudget } from "@/lib/store";
import { CATEGORIES, euros, dateCourte } from "@/lib/format";

export default function TxRow({ tx, avecCompte = false }) {
  const { comptes, supprimerTransaction } = useBudget();
  const cat = CATEGORIES[tx.categorie] || CATEGORIES.autre;
  const compte = comptes.find((c) => c.id === tx.compteId);
  const positif = tx.montant > 0;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fond text-lg">{cat.icone}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {tx.libelle || cat.label}
          {tx.horsSolde && <span className="ml-1.5 rounded-pill bg-voile px-1.5 py-0.5 text-[10px] font-medium text-sourdine align-middle">👻 hors solde</span>}
        </div>
        <div className="text-xs text-sourdine">
          {dateCourte(tx.date)}{avecCompte && compte ? ` · ${compte.nom}` : ""}
        </div>
      </div>
      <span className={`tnum text-sm font-bold ${(CATEGORIES[tx.categorie] || CATEGORIES.autre).type === "virement" ? "text-sourdine" : positif ? "text-menthe" : "text-encre"}`}>
        {positif ? "+" : ""}{euros(tx.montant, { precis: true })}
      </span>
      <button
        onClick={() => supprimerTransaction(tx.id)}
        aria-label="Supprimer"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sourdine opacity-60 active:bg-corail-pale active:text-corail"
      >
        ✕
      </button>
    </li>
  );
}
