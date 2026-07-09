"use client";

import { useMemo } from "react";
import { statsMois } from "@/lib/conseils";
import { toutesCategories as CATEGORIES, euros } from "@/lib/format";

const PALETTE = ["#2BB68C", "#8B7CF6", "#3E9BFF", "#FF9D5C", "#F5B93E", "#FF6B5E", "#7A8199"];

export default function DonutCat({ transactions, mois }) {
  const { parts, total } = useMemo(() => {
    const s = statsMois(transactions, mois);
    const entrees = Object.entries(s.parCategorie).sort((a, b) => b[1] - a[1]);
    const top = entrees.slice(0, 6);
    const reste = entrees.slice(6).reduce((a, [, v]) => a + v, 0);
    if (reste > 0) top.push(["_reste", reste]);
    return { parts: top, total: s.depenses };
  }, [transactions, mois]);

  if (total === 0) {
    return (
      <div className="rounded-ios bg-carte p-5 text-center text-sm text-sourdine shadow-carte">
        Aucune dépense ce mois-ci pour l'instant.
      </div>
    );
  }

  const R = 44, C = 2 * Math.PI * R;
  let decalage = 0;

  return (
    <div className="rounded-ios bg-carte p-4 shadow-carte">
      <h3 className="mb-3 font-semibold">Répartition du mois</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 110 110" className="h-28 w-28 -rotate-90" role="img" aria-label="Répartition des dépenses par catégorie">
          {parts.map(([cat, val], i) => {
            const frac = val / total;
            const seg = (
              <circle
                key={cat}
                cx="55" cy="55" r={R} fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="14"
                strokeDasharray={`${frac * C - 2} ${C}`}
                strokeDashoffset={-decalage}
                strokeLinecap="round"
              />
            );
            decalage += frac * C;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="chiffres text-sm font-bold leading-none">{euros(total)}</span>
          <span className="mt-0.5 text-[10px] text-sourdine">ce mois-ci</span>
        </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {parts.map(([cat, val], i) => {
            const c = cat === "_reste" ? { icone: "…", label: "Autres" } : CATEGORIES[cat] || CATEGORIES.autre;
            return (
              <li key={cat} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="truncate">{c.label}</span>
                </span>
                <span className="tnum shrink-0 font-semibold">{euros(val)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
