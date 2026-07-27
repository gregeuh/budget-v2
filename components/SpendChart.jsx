"use client";

import { useMemo } from "react";
import { statsMois } from "@/lib/conseils";
import { euros, cleMoisLocal } from "@/lib/format";

export default function SpendChart({ transactions }) {
  const donnees = useMemo(() => {
    const premiereDate = transactions.map((t) => t.date).sort()[0];
    const actuel = new Date();
    let profondeur = 5;
    if (premiereDate) {
      const [pa, pm] = premiereDate.split("-").map(Number);
      profondeur = Math.min(5, Math.max(1, (actuel.getFullYear() - pa) * 12 + (actuel.getMonth() + 1 - pm)));
    }
    const out = [];
    for (let i = profondeur; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const cle = cleMoisLocal(d);
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
  const L = 320, H = 104, PAD = 6;
  const largeurGroupe = (L - PAD * 2) / donnees.length;
  const barre = Math.min(14, largeurGroupe / 3.2);
  const moisCourant = cleMoisLocal();
  const derniere = donnees.length - 1;

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Revenus & dépenses</h3>
        <div className="flex gap-3 text-xs text-sourdine">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-menthe" />Revenus</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-corail" />Dépenses</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${L} ${H + 18}`} className="w-full" role="img" aria-label="Revenus et dépenses des six derniers mois">
        {/* Lignes de grille horizontales, discrètes */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD} y1={H - f * (H - 10)} x2={L - PAD} y2={H - f * (H - 10)}
            stroke="var(--c-bordure)" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
        ))}
        {/* Ligne de base pleine */}
        <line x1={PAD} y1={H} x2={L - PAD} y2={H} stroke="var(--c-bordure)" strokeWidth="1" />

        {donnees.map((d, i) => {
          const x = PAD + i * largeurGroupe + largeurGroupe / 2;
          const hR = (d.revenus / max) * (H - 10);
          const hD = (d.depenses / max) * (H - 10);
          const enCours = i === derniere;
          return (
            <g key={i}>
              <rect
                x={x - barre - 1.5} y={H - hR} width={barre} height={Math.max(hR, 2)} rx={barre / 2.4}
                fill="var(--menthe)" opacity={d.revenus ? (enCours ? 1 : 0.85) : 0.15}
                className="barre-monte" style={{ animationDelay: `${i * 70}ms` }}
              />
              <rect
                x={x + 1.5} y={H - hD} width={barre} height={Math.max(hD, 2)} rx={barre / 2.4}
                fill="var(--corail)" opacity={d.depenses ? (enCours ? 1 : 0.85) : 0.15}
                className="barre-monte" style={{ animationDelay: `${i * 70 + 35}ms` }}
              />
              <text x={x} y={H + 14} textAnchor="middle" fontSize="11" fontWeight={enCours ? 700 : 400}
                fill={enCours ? "var(--c-encre)" : "var(--c-sourdine)"}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <p className="tnum mt-1 text-right text-xs text-sourdine">
        Ce mois-ci : {euros(donnees[donnees.length - 1].revenus)} entrés · {euros(donnees[donnees.length - 1].depenses)} sortis
      </p>
    </div>
  );
}
