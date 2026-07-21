"use client";

import { useState } from "react";
import { lireJournal, viderJournal } from "@/lib/journal";
import Sheet from "./Sheet";

const ETIQUETTES = {
  reseau: { label: "Réseau", icone: "📡" },
  plantage: { label: "Plantage", icone: "💥" },
  promesse: { label: "Traitement", icone: "⏳" },
};

const quand = (iso) => {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function JournalSheet({ onFermer }) {
  const [entrees, setEntrees] = useState(() => lireJournal());

  const vider = () => {
    viderJournal();
    setEntrees([]);
  };

  return (
    <Sheet titre="Journal technique" onFermer={onFermer}>
      {entrees.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 text-sm text-sourdine">Aucune erreur enregistrée. Tout va bien.</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-voile py-3 font-semibold">Fermer</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-sourdine">
            Les {entrees.length} derniers incidents techniques, gardés sur cet appareil uniquement.
            Aucun montant ni libellé n&apos;y figure. Utile pour comprendre ce qui a échoué.
          </p>

          <ul className="space-y-1.5">
            {entrees.map((e, i) => {
              const et = ETIQUETTES[e.type] || { label: e.type, icone: "•" };
              return (
                <li key={i} className="rounded-2xl bg-carte px-3 py-2.5 shadow-carte">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {et.icone} {et.label}
                      {e.statut ? <span className="ml-1.5 text-xs font-medium text-corail">{e.statut}</span> : null}
                    </span>
                    <span className="tnum shrink-0 text-[11px] text-sourdine">{quand(e.date)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-xs text-sourdine">{e.message}</p>
                  {e.ou && <p className="mt-0.5 break-all text-[11px] text-sourdine/70">{e.ou}</p>}
                </li>
              );
            })}
          </ul>

          <button onClick={vider} className="w-full rounded-ios bg-voile py-2.5 text-sm font-semibold">
            Vider le journal
          </button>
        </div>
      )}
    </Sheet>
  );
}
