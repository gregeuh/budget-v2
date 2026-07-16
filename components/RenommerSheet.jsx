"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, dateCourte } from "@/lib/format";
import { nettoyerLibelle } from "@/lib/libelles";
import Sheet from "./Sheet";

export default function RenommerSheet({ onFermer }) {
  const { transactions, modifierTransaction, notifier } = useBudget();
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(0);

  // Transactions dont le nettoyage produirait un libellé différent (et meilleur)
  const propositions = useMemo(() => {
    const vus = new Map();
    for (const t of transactions) {
      if (t.versId) continue;
      const source = t.libelleBanque || t.libelle || "";
      if (!source) continue;
      const propre = nettoyerLibelle(source);
      // On ne propose que si ça change vraiment et raccourcit/clarifie
      if (propre && propre !== t.libelle && propre.length <= source.length + 2) {
        vus.set(t.id, { id: t.id, avant: t.libelle || source, apres: propre, montant: t.montant, date: t.date });
      }
    }
    return [...vus.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const [choisis, setChoisis] = useState(() => new Set());
  const tousChoisis = choisis.size === propositions.length && propositions.length > 0;

  // Initialiser à "tout sélectionné" au premier rendu
  useMemo(() => {
    if (propositions.length > 0 && choisis.size === 0) {
      setChoisis(new Set(propositions.map((p) => p.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propositions.length]);

  const basculer = (id) => {
    setChoisis((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const appliquer = async () => {
    setEnCours(true);
    try {
      let n = 0;
      for (const p of propositions) {
        if (!choisis.has(p.id)) continue;
        await modifierTransaction(p.id, { libelle: p.apres }, { silencieux: true });
        n++;
      }
      setTermine(n);
      notifier(`${n} libellé${n > 1 ? "s" : ""} nettoyé${n > 1 ? "s" : ""}`, "✨");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Sheet titre="Nettoyer les libellés" onFermer={onFermer}>
      {termine > 0 ? (
        <div className="py-8 text-center">
          <div className="text-4xl">✨</div>
          <p className="mt-2 font-semibold">{termine} libellé{termine > 1 ? "s" : ""} nettoyé{termine > 1 ? "s" : ""}</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-encre py-3 font-semibold text-contraste">Fermer</button>
        </div>
      ) : propositions.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 text-sm text-sourdine">Tous tes libellés sont déjà propres, rien à nettoyer.</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-voile py-3 font-semibold">Fermer</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-sourdine">
            {propositions.length} opération{propositions.length > 1 ? "s" : ""} peuvent avoir un nom plus lisible. Décoche celles que tu veux garder telles quelles.
          </p>

          <button
            onClick={() => setChoisis(tousChoisis ? new Set() : new Set(propositions.map((p) => p.id)))}
            className="text-xs font-semibold text-ciel"
          >
            {tousChoisis ? "Tout décocher" : "Tout cocher"}
          </button>

          <ul className="space-y-1.5">
            {propositions.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 shadow-carte ${choisis.has(p.id) ? "bg-carte ring-1 ring-menthe/40" : "bg-carte opacity-60"}`}
              >
                <button
                  onClick={() => basculer(p.id)}
                  aria-label={choisis.has(p.id) ? "Décocher" : "Cocher"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${choisis.has(p.id) ? "bg-menthe text-white" : "bg-voile text-sourdine"}`}
                >
                  {choisis.has(p.id) ? "✓" : ""}
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] text-sourdine line-through">{p.avant}</span>
                  <span className="block truncate text-sm font-semibold">{p.apres}</span>
                </span>
                <span className="tnum shrink-0 text-xs text-sourdine">{dateCourte(p.date)}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={appliquer}
            disabled={enCours || choisis.size === 0}
            className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste disabled:opacity-40"
          >
            {enCours ? "Nettoyage…" : `Nettoyer ${choisis.size} libellé${choisis.size > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </Sheet>
  );
}
