"use client";

import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, PLAFONDS, euros, cleMois, aujourdhui, dateCourte } from "@/lib/format";
import Sheet from "./Sheet";
import TxRow from "./TxRow";

function LigneStat({ label, valeur, couleur = "", dernier = false }) {
  return (
    <div className={`flex items-center justify-between px-3.5 py-3 ${dernier ? "" : "border-b border-bordure"}`}>
      <span className="text-sm text-sourdine">{label}</span>
      <span className={`chiffres text-sm font-bold ${couleur}`}>{valeur}</span>
    </div>
  );
}

export default function FicheCompte({ compte, onFermer }) {
  const { transactions, soldes, comptes } = useBudget();

  const t = TYPES_COMPTE[compte.type] || TYPES_COMPTE.autre;
  const coul = COULEURS[t.couleur];
  const solde = soldes[compte.id] || 0;
  const plafond = compte.type === "livretA" ? PLAFONDS.livretA : compte.type === "ldds" ? PLAFONDS.ldds : null;

  const stats = useMemo(() => {
    const mois = cleMois(aujourdhui());
    let entrees = 0, sorties = 0;
    const liees = [];
    for (const tx of transactions) {
      const concerne = tx.compteId === compte.id || tx.versId === compte.id;
      if (!concerne) continue;
      liees.push(tx);
      if (!tx.date.startsWith(mois) || tx.horsSolde) continue;
      if (tx.versId) {
        const val = Math.abs(tx.montant);
        if (tx.compteId === compte.id) sorties += val;
        else entrees += val;
      } else if (tx.montant > 0) entrees += tx.montant;
      else sorties += -tx.montant;
    }
    liees.sort((a, b) => b.date.localeCompare(a.date));
    return { entrees, sorties, liees, dernier: liees[0] || null };
  }, [transactions, compte.id]);

  const recentes = stats.liees.filter((tx) => tx.date <= aujourdhui()).slice(0, 15);

  return (
    <Sheet titre={compte.nom} onFermer={onFermer}>
      <div className="space-y-3">
        {/* La carte, au premier plan */}
        <div
          className="relative overflow-hidden rounded-ios p-4 shadow-flottant"
          style={{
            background: `linear-gradient(135deg, ${coul.fond}, transparent 70%)`,
            backgroundColor: "var(--c-carte)",
            border: `1px solid ${coul.vif}33`,
          }}
        >
          <div className="reflet" />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: coul.vif + "26" }}>
              {t.icone}
            </span>
            <span className="rounded-pill bg-voile px-2 py-0.5 text-[11px] font-semibold text-sourdine">{t.label}</span>
          </div>
          <div className="relative mt-4">
            <div className={`chiffres text-[34px] font-bold leading-none ${solde < 0 ? "text-corail" : ""}`}>
              {euros(solde, { precis: true })}
            </div>
            <div className="mt-1 text-[13px] text-sourdine">Solde actuel</div>
          </div>
          {plafond && (
            <div className="relative mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-voile">
                <div
                  className="jauge-in h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: coul.vif }}
                />
              </div>
              <p className="mt-1 text-[11px] text-sourdine">
                {Math.max(0, Math.round((solde / plafond) * 100))} % du plafond ({euros(plafond)}) · reste {euros(Math.max(0, plafond - solde))}
              </p>
            </div>
          )}
        </div>

        {/* Détails, en lignes groupées façon Wallet */}
        <div className="overflow-hidden rounded-ios bg-carte shadow-carte">
          <LigneStat label="Entrées ce mois-ci" valeur={`+${euros(stats.entrees)}`} couleur="text-menthe" />
          <LigneStat label="Sorties ce mois-ci" valeur={`−${euros(stats.sorties)}`} couleur="text-corail" />
          <LigneStat
            label="Variation du mois"
            valeur={`${stats.entrees - stats.sorties >= 0 ? "+" : ""}${euros(stats.entrees - stats.sorties)}`}
            couleur={stats.entrees - stats.sorties >= 0 ? "text-menthe" : "text-corail"}
          />
          <LigneStat
            label="Dernier mouvement"
            valeur={stats.dernier ? dateCourte(stats.dernier.date) : "—"}
            dernier
          />
        </div>

        {/* Opérations du compte */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sourdine">
            Opérations {stats.liees.length > 15 && <span className="font-medium normal-case">· 15 dernières</span>}
          </h3>
          {recentes.length === 0 ? (
            <p className="rounded-ios bg-carte p-4 text-center text-sm text-sourdine shadow-carte">
              Aucune opération sur ce compte.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentes.map((tx, i) => <TxRow key={tx.id} tx={tx} retard={i} />)}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
