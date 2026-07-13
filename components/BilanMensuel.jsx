"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, TYPES_COMPTE, moisDecaleLocal } from "@/lib/format";
import { statsMois } from "@/lib/conseils";
import Sheet from "./Sheet";

const CLE_FERME = "bilan-ferme";

const moisDecale = (n) => moisDecaleLocal(n);

const nomMois = (m) => {
  const s = new Date(m + "-15").toLocaleDateString("fr-FR", { month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function BilanMensuel() {
  const { transactions, comptes, budgets, categories } = useBudget();
  const [ouvert, setOuvert] = useState(false);
  const [ferme, setFerme] = useState(() => {
    try { return localStorage.getItem(CLE_FERME); } catch { return null; }
  });

  const moisPrec = moisDecale(-1);
  const moisAvant = moisDecale(-2);
  const jourDuMois = new Date().getDate();

  const bilan = useMemo(() => {
    const s = statsMois(transactions, moisPrec);
    const avant = statsMois(transactions, moisAvant);
    if (s.revenus === 0 && s.depenses === 0) return null;

    const top = Object.entries(s.parCategorie).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const maxTop = top[0]?.[1] || 1;

    const entreesBudgets = Object.entries(budgets || {}).filter(([, l]) => l > 0);
    const respectes = entreesBudgets.filter(([cat, limite]) => (s.parCategorie[cat] || 0) <= limite).length;

    // Variation du patrimoine (soldes des comptes, hors titres-resto) sur le mois écoulé
    const ids = new Set(
      comptes.filter((c) => (TYPES_COMPTE[c.type] || TYPES_COMPTE.autre).groupe !== "avantages").map((c) => c.id)
    );
    const valeurA = (limite) => {
      let v = comptes.filter((c) => ids.has(c.id)).reduce((a, c) => a + (c.soldeInitial || 0), 0);
      for (const t of transactions) {
        if (t.date > limite || t.horsSolde) continue;
        if (t.versId) {
          const val = Math.abs(t.montant);
          if (ids.has(t.compteId)) v -= val;
          if (ids.has(t.versId)) v += val;
        } else if (ids.has(t.compteId)) v += t.montant;
      }
      return v;
    };
    const finPrec = `${moisPrec}-31`;
    const finAvant = `${moisAvant}-31`;
    const variationPatrimoine = valeurA(finPrec) - valeurA(finAvant);

    const deltaDepenses = avant.depenses > 0 ? Math.round(((s.depenses - avant.depenses) / avant.depenses) * 100) : null;

    let phrase;
    if (s.solde >= s.revenus * 0.2) phrase = "Mois excellent : plus de 20 % des revenus mis de côté. 🏆";
    else if (s.solde >= 0) phrase = "Mois maîtrisé : tu as dépensé moins que tes revenus. 👍";
    else phrase = "Mois dans le rouge : les dépenses ont dépassé les revenus. Le détail ci-dessous t'aidera à voir où.";

    return { s, top, maxTop, entreesBudgets, respectes, variationPatrimoine, deltaDepenses, phrase };
  }, [transactions, comptes, budgets, moisPrec, moisAvant]);

  const fermerBanniere = () => {
    setFerme(moisPrec);
    try { localStorage.setItem(CLE_FERME, moisPrec); } catch {}
  };

  if (!bilan || jourDuMois > 10 || ferme === moisPrec) return null;

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="pop-in relative w-full overflow-hidden rounded-ios p-3.5 text-left shadow-carte"
        style={{ background: "linear-gradient(135deg, #17203A, #2C3A6E)" }}
      >
        <div className="reflet" />
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-white">Ton bilan de {nomMois(moisPrec).toLowerCase()} est prêt</span>
            <span className="block text-xs text-white/60">
              {euros(bilan.s.depenses)} dépensés · {bilan.s.solde >= 0 ? `${euros(bilan.s.solde)} épargnés` : `${euros(-bilan.s.solde)} de déficit`}
            </span>
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); fermerBanniere(); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white/70"
            aria-label="Masquer"
          >
            ✕
          </span>
        </div>
      </button>

      {ouvert && (
        <Sheet titre={`Bilan de ${nomMois(moisPrec).toLowerCase()}`} onFermer={() => setOuvert(false)}>
          <div className="space-y-3">
            {/* Solde du mois */}
            <div className="rounded-ios bg-fond p-4 text-center">
              <div className={`chiffres text-3xl font-bold ${bilan.s.solde >= 0 ? "text-menthe" : "text-corail"}`}>
                {bilan.s.solde >= 0 ? "+" : ""}{euros(bilan.s.solde)}
              </div>
              <p className="mt-0.5 text-xs text-sourdine">{bilan.s.solde >= 0 ? "épargnés sur le mois" : "de déficit sur le mois"}</p>
              <p className="mt-2 text-sm">{bilan.phrase}</p>
            </div>

            {/* Entrées / sorties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-ios bg-menthe-pale p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-menthe-texte">Entrées</p>
                <p className="chiffres text-lg font-bold text-menthe-texte">{euros(bilan.s.revenus)}</p>
              </div>
              <div className="rounded-ios bg-corail-pale p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-corail-texte">Sorties</p>
                <p className="chiffres text-lg font-bold text-corail-texte">{euros(bilan.s.depenses)}</p>
                {bilan.deltaDepenses !== null && (
                  <p className="text-[11px] text-corail-texte/80">
                    {bilan.deltaDepenses > 0 ? "+" : ""}{bilan.deltaDepenses} % vs {nomMois(moisAvant).toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            {/* Top catégories */}
            {bilan.top.length > 0 && (
              <div className="rounded-ios bg-fond p-3.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sourdine">Top dépenses</p>
                <div className="space-y-2">
                  {bilan.top.map(([cat, val]) => {
                    const c = categories[cat] || categories.autre;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{c.icone} {c.label}</span>
                          <span className="tnum font-semibold">{euros(val)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-voile">
                          <div className="jauge-in h-full rounded-full bg-lavande" style={{ width: `${(val / bilan.maxTop) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Budgets + patrimoine */}
            <div className="grid grid-cols-2 gap-3">
              {bilan.entreesBudgets.length > 0 && (
                <div className="rounded-ios bg-fond p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Budgets</p>
                  <p className="chiffres text-lg font-bold">{bilan.respectes}/{bilan.entreesBudgets.length}</p>
                  <p className="text-[11px] text-sourdine">respectés</p>
                </div>
              )}
              <div className="rounded-ios bg-fond p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Patrimoine</p>
                <p className={`chiffres text-lg font-bold ${bilan.variationPatrimoine >= 0 ? "text-menthe" : "text-corail"}`}>
                  {bilan.variationPatrimoine >= 0 ? "+" : ""}{euros(bilan.variationPatrimoine)}
                </p>
                <p className="text-[11px] text-sourdine">sur le mois</p>
              </div>
            </div>

            <button
              onClick={() => { fermerBanniere(); setOuvert(false); }}
              className="w-full rounded-ios bg-encre py-3 font-semibold text-contraste"
            >
              C'est noté 👍
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
