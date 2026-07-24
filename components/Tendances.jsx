"use client";

import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { euros, COULEURS } from "@/lib/format";
import { tendances } from "@/lib/tendances";

const SENS = {
  hausse: { fleche: "▲", classe: "text-corail" },
  baisse: { fleche: "▼", classe: "text-menthe" },
  stable: { fleche: "=", classe: "text-sourdine" },
};

const nomMois = (cle) => {
  const [a, m] = cle.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
};

export default function Tendances({ nbMois = 3 }) {
  const { transactions } = useBudget();
  const t = useMemo(() => tendances(transactions, nbMois), [transactions, nbMois]);

  if (t.lignes.length === 0) return null;

  const maxTotal = Math.max(...Object.values(t.totaux), 1);
  const derniersMois = t.lignes.slice(0, 6);

  return (
    <div className="space-y-3">
      {/* Total par mois, en barres */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sourdine">
          Dépenses des {t.mois.length} derniers mois
        </p>
        <div className="flex items-end gap-2">
          {t.mois.map((m) => {
            const val = t.totaux[m];
            const enCours = m === t.moisCourant;
            return (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <span className="tnum text-[11px] font-semibold">{euros(val)}</span>
                <div
                  className={`jauge-in w-full rounded-lg ${enCours ? "bg-marque/40" : "bg-marque"}`}
                  style={{ height: `${Math.max(8, (val / maxTotal) * 72)}px` }}
                />
                <span className="text-[11px] text-sourdine">
                  {nomMois(m)}
                  {enCours && " •"}
                </span>
              </div>
            );
          })}
        </div>
        {t.mois.includes(t.moisCourant) && (
          <p className="mt-1.5 text-[11px] text-sourdine">
            • Mois en cours, encore incomplet — comparé à une moyenne de {euros(t.reference)}.
          </p>
        )}
      </div>

      {/* Par catégorie : où ça dérive */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sourdine">Par catégorie</p>
        {derniersMois.map((l) => {
          const s = SENS[l.sens];
          const max = Math.max(...l.serie, 1);
          const teinte = COULEURS[l.couleur]?.vif || "var(--marque)";
          return (
            <div key={l.id} className="flex items-center gap-2.5 rounded-2xl bg-fond px-3 py-2">
              <span className="text-base">{l.icone}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{l.label}</span>
                <span className="block text-[11px] text-sourdine">
                  {l.serie.map((v) => euros(v)).join(" → ")}
                </span>
              </span>

              {/* Mini-graphique : une barre par mois */}
              <span className="flex h-7 shrink-0 items-end gap-0.5" aria-hidden="true">
                {l.serie.map((v, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-sm"
                    style={{
                      height: `${Math.max(3, (v / max) * 28)}px`,
                      background: teinte,
                      opacity: i === l.serie.length - 1 ? 1 : 0.35,
                    }}
                  />
                ))}
              </span>

              <span className={`tnum shrink-0 text-xs font-semibold ${s.classe}`}>
                {s.fleche}
                {l.pourcent !== null && l.sens !== "stable" ? ` ${Math.abs(l.pourcent)}%` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
