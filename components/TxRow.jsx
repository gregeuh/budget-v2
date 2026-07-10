"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, dateCourte } from "@/lib/format";
import EditTxSheet from "./EditTxSheet";

export default function TxRow({ tx, avecCompte = false, retard = 0 }) {
  const { comptes, categories, supprimerTransaction } = useBudget();
  const [edition, setEdition] = useState(false);
  const cat = categories[tx.categorie] || categories.autre;
  const compte = comptes.find((c) => c.id === tx.compteId);
  const versCompte = tx.versId ? comptes.find((c) => c.id === tx.versId) : null;
  const positif = tx.montant > 0;
  const estVirement = Boolean(tx.versId);

  return (
    <>
      <li className="pop-in flex items-center gap-3 rounded-2xl bg-carte px-3 py-2.5 shadow-carte" style={{ animationDelay: `${Math.min(retard, 8) * 50}ms` }}>
        <button onClick={() => setEdition(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fond text-lg">{cat.icone}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {tx.libelle || cat.label}
              {tx.horsSolde && <span className="ml-1.5 rounded-pill bg-voile px-1.5 py-0.5 align-middle text-[10px] font-medium text-sourdine">👻 hors solde</span>}
            </span>
            <span className="block text-xs text-sourdine">
              {dateCourte(tx.date)}
              {estVirement
                ? ` · ${compte?.nom || "?"} → ${versCompte?.nom || "?"}`
                : avecCompte && compte ? ` · ${compte.nom}` : ""}
            </span>
          </span>
          <span className={`tnum shrink-0 text-sm font-bold ${cat.type === "virement" ? "text-sourdine" : positif ? "text-menthe" : "text-encre"}`}>
            {estVirement ? "⇄ " : positif ? "+" : ""}{euros(estVirement ? Math.abs(tx.montant) : tx.montant, { precis: true })}
          </span>
        </button>
        <button
          onClick={() => supprimerTransaction(tx.id)}
          aria-label="Supprimer"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sourdine/50 active:bg-corail-pale active:text-corail"
        >
          ✕
        </button>
      </li>
      {edition && <EditTxSheet tx={tx} onFermer={() => setEdition(false)} />}
    </>
  );
}
