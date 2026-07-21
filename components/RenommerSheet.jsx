"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { dateCourte } from "@/lib/format";
import { nettoyerLibelle } from "@/lib/libelles";
import Sheet from "./Sheet";

export default function RenommerSheet({ onFermer }) {
  const { transactions, modifierTransaction, notifier } = useBudget();
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(0);
  const [edits, setEdits] = useState({}); // { cleGroupe: nomChoisi }
  const [ignores, setIgnores] = useState(() => new Set());

  // Regrouper les transactions par libellé d'origine (celui de la banque, ou le libellé actuel)
  const groupes = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.versId) continue;
      const origine = (t.libelleBanque || t.libelle || "").trim();
      if (!origine) continue;
      const suggere = nettoyerLibelle(origine);
      // Grouper par libellé NETTOYÉ : rassemble les occurrences dont seule la date change
      const cle = suggere.toLowerCase();
      if (!map.has(cle)) {
        map.set(cle, {
          cle,
          origine,
          suggere,
          actuel: t.libelle || origine,
          ids: [],
          dernierDate: t.date,
        });
      }
      const g = map.get(cle);
      g.ids.push(t.id);
      if (t.date > g.dernierDate) g.dernierDate = t.date;
    }
    // Ne garder que les groupes où un renommage a du sens (suggestion différente de l'actuel)
    // OU où il y a plusieurs occurrences (utile de les uniformiser même à la main)
    return [...map.values()]
      .filter((g) => g.suggere !== g.actuel || g.ids.length > 1)
      .sort((a, b) => b.ids.length - a.ids.length || b.dernierDate.localeCompare(a.dernierDate));
  }, [transactions]);

  const nomFinal = (g) => (edits[g.cle] !== undefined ? edits[g.cle] : g.suggere);

  const appliquer = async () => {
    setEnCours(true);
    try {
      let n = 0;
      for (const g of groupes) {
        if (ignores.has(g.cle)) continue;
        const nom = (nomFinal(g) || "").trim();
        if (!nom || nom === g.actuel) continue;
        // Propagation : toutes les occurrences du groupe prennent le même nom
        for (const id of g.ids) {
          await modifierTransaction(id, { libelle: nom }, { silencieux: true });
          n++;
        }
      }
      setTermine(n);
      notifier(`${n} opération${n > 1 ? "s" : ""} renommée${n > 1 ? "s" : ""}`, "✨");
    } finally {
      setEnCours(false);
    }
  };

  const nbActifs = groupes.filter((g) => !ignores.has(g.cle) && (nomFinal(g) || "").trim() && nomFinal(g).trim() !== g.actuel).length;

  return (
    <Sheet titre="Nettoyer les libellés" onFermer={onFermer}>
      {termine > 0 ? (
        <div className="py-8 text-center">
          <div className="text-4xl">✨</div>
          <p className="mt-2 font-semibold">{termine} opération{termine > 1 ? "s" : ""} renommée{termine > 1 ? "s" : ""}</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque">Fermer</button>
        </div>
      ) : groupes.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 text-sm text-sourdine">Tous tes libellés sont déjà propres, rien à nettoyer.</p>
          <button onClick={onFermer} className="mt-5 w-full rounded-ios bg-voile py-3 font-semibold">Fermer</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-sourdine">
            Chaque nom s&apos;applique à <strong>toutes</strong> les opérations du même libellé. Modifie le nom proposé si tu veux, ou décoche pour laisser tel quel.
          </p>

          <ul className="space-y-2">
            {groupes.map((g) => {
              const actif = !ignores.has(g.cle);
              return (
                <li key={g.cle} className={`rounded-2xl px-3 py-2.5 shadow-carte ${actif ? "bg-carte ring-1 ring-menthe/40" : "bg-carte opacity-60"}`}>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIgnores((s) => { const n = new Set(s); n.has(g.cle) ? n.delete(g.cle) : n.add(g.cle); return n; })}
                      aria-label={actif ? "Ne pas renommer" : "Renommer"}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${actif ? "bg-menthe-bouton text-white" : "bg-voile text-sourdine"}`}
                    >
                      {actif ? "✓" : ""}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] text-sourdine">
                        {g.origine.length > 34 ? g.origine.slice(0, 34) + "…" : g.origine}
                        {g.ids.length > 1 && <span className="ml-1 font-semibold text-menthe-texte">· {g.ids.length}×</span>}
                      </span>
                      <input
                        value={nomFinal(g)}
                        onChange={(e) => setEdits((ed) => ({ ...ed, [g.cle]: e.target.value }))}
                        disabled={!actif}
                        className="mt-0.5 w-full rounded-lg border border-bordure bg-fond px-2 py-1.5 text-sm font-semibold outline-none focus:border-menthe disabled:opacity-50"
                      />
                    </span>
                    <span className="tnum shrink-0 self-start text-[11px] text-sourdine">{dateCourte(g.dernierDate)}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            onClick={appliquer}
            disabled={enCours || nbActifs === 0}
            className="w-full rounded-ios bg-marque-bouton py-3 font-semibold text-surMarque disabled:opacity-40"
          >
            {enCours ? "Renommage…" : `Renommer ${nbActifs} groupe${nbActifs > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </Sheet>
  );
}
