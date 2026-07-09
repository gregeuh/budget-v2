"use client";

import { useMemo } from "react";
import { statsMois } from "@/lib/conseils";
import { euros } from "@/lib/format";

export default function SpendChart({ transactions }) {
  const donnees = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const cle = d.toISOString().slice(0, 7);
      const s = statsMois(transactions, cle);
      out.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        depenses: s.depenses,
        revenus: s.revenus,
      });
    }
    return out;
  }, [transactions]);

  const max = Math.max(1, ...donnees.map((d) => Math.max(d.depenses, d.revenus)));
  const L = 320, H = 130, PAD = 6;
  const largeurGroupe = (L - PAD * 2) / donnees.length;
  const barre = Math.min(16, largeurGroupe / 3);

  return (
    <div className="rounded-ios bg-carte p-4 shadow-carte">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">6 derniers mois</h3>
        <div className="flex gap-3 text-xs text-sourdine">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-menthe" />Revenus</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-corail" />Dépenses</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${L} ${H + 18}`} className="w-full" role="img" aria-label="Revenus et dépenses des six derniers mois">
        {donnees.map((d, i) => {
          const x = PAD + i * largeurGroupe + largeurGroupe / 2;
          const hR = (d.revenus / max) * (H - 10);
          const hD = (d.depenses / max) * (H - 10);
          return (
            <g key={i}>
              <rect x={x - barre - 1.5} y={H - hR} width={barre} height={Math.max(hR, 2)} rx={4} fill="#2BB68C" opacity={d.revenus ? 1 : 0.15} />
              <rect x={x + 1.5} y={H - hD} width={barre} height={Math.max(hD, 2)} rx={4} fill="#FF6B5E" opacity={d.depenses ? 1 : 0.15} />
              <text x={x} y={H + 14} textAnchor="middle" fontSize="11" fill="#7A8199">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <p className="tnum mt-1 text-right text-xs text-sourdine">
        Ce mois-ci : {euros(donnees[5].revenus)} entrés · {euros(donnees[5].depenses)} sortis
      </p>
    </div>
  );
}
