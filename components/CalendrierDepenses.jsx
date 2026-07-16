"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { euros, cleMoisLocal } from "@/lib/format";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

export default function CalendrierDepenses({ mois }) {
  const { transactions } = useBudget();
  const [jourSel, setJourSel] = useState(null);
  const moisCle = mois || cleMoisLocal();
  const [annee, moisNum] = moisCle.split("-").map(Number);

  const { jours, max, totalMois } = useMemo(() => {
    const parJour = {};
    let total = 0;
    for (const t of transactions) {
      if (!t.date.startsWith(moisCle) || t.versId || t.horsSolde || t.montant >= 0) continue;
      const j = Number(t.date.slice(8, 10));
      const val = -t.montant;
      parJour[j] = (parJour[j] || 0) + val;
      total += val;
    }
    const max = Math.max(1, ...Object.values(parJour));
    const nbJours = new Date(annee, moisNum, 0).getDate();
    const premierJour = (new Date(annee, moisNum - 1, 1).getDay() + 6) % 7; // lundi = 0
    const jours = [];
    for (let i = 0; i < premierJour; i++) jours.push(null);
    for (let j = 1; j <= nbJours; j++) jours.push({ jour: j, montant: parJour[j] || 0 });
    return { jours, max, totalMois: total };
  }, [transactions, moisCle, annee, moisNum]);

  // Opérations du jour sélectionné
  const opsJour = useMemo(() => {
    if (!jourSel) return [];
    const cle = `${moisCle}-${String(jourSel).padStart(2, "0")}`;
    return transactions
      .filter((t) => t.date === cle && !t.versId && !t.horsSolde && t.montant < 0)
      .sort((a, b) => a.montant - b.montant);
  }, [transactions, jourSel, moisCle]);

  const intensite = (montant) => {
    if (montant <= 0) return 0;
    return 0.15 + 0.85 * (montant / max);
  };

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Calendrier des dépenses</h3>
        <span className="tnum text-sm text-sourdine">{euros(totalMois)}</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-semibold text-sourdine">{j}</div>
        ))}
        {jours.map((c, i) =>
          c === null ? (
            <div key={`v-${i}`} />
          ) : (
            <button
              key={c.jour}
              onClick={() => setJourSel(jourSel === c.jour ? null : c.jour)}
              className={`relative aspect-square rounded-lg text-[11px] font-medium transition-transform active:scale-90 ${jourSel === c.jour ? "ring-2 ring-encre" : ""}`}
              style={{
                background: c.montant > 0 ? `rgba(229, 118, 107, ${intensite(c.montant)})` : "var(--c-voile)",
                color: intensite(c.montant) > 0.55 ? "#fff" : "var(--c-sourdine)",
              }}
              title={c.montant > 0 ? euros(c.montant) : ""}
            >
              {c.jour}
            </button>
          )
        )}
      </div>

      {/* Légende */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-sourdine">
        <span>moins</span>
        {[0.15, 0.4, 0.65, 0.9].map((o) => (
          <span key={o} className="h-2.5 w-2.5 rounded-sm" style={{ background: `rgba(229, 118, 107, ${o})` }} />
        ))}
        <span>plus</span>
      </div>

      {/* Détail du jour sélectionné */}
      {jourSel && (
        <div className="fade-in mt-3 border-t border-bordure pt-3">
          <p className="mb-2 text-sm font-semibold">
            {jourSel} {new Date(annee, moisNum - 1).toLocaleDateString("fr-FR", { month: "long" })} · {euros(opsJour.reduce((a, t) => a - t.montant, 0))}
          </p>
          {opsJour.length === 0 ? (
            <p className="text-xs text-sourdine">Aucune dépense ce jour-là 🎉</p>
          ) : (
            <ul className="space-y-1">
              {opsJour.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="min-w-0 flex-1 truncate">{t.libelle}</span>
                  <span className="tnum shrink-0 font-medium text-corail">{euros(t.montant, { precis: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
