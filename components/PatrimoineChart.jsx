"use client";

import { useMemo } from "react";
import { euros } from "@/lib/format";

export default function PatrimoineChart({ comptes, transactions }) {
  const points = useMemo(() => {
    const socle = comptes.reduce((a, c) => a + (c.soldeInitial || 0), 0);
    // Démarre au premier mois d'activité (au plus 12 mois d'historique)
    const premiereDate = transactions.map((t) => t.date).sort()[0];
    const actuel = new Date();
    let profondeur = 0;
    if (premiereDate) {
      const [pa, pm] = premiereDate.split("-").map(Number);
      profondeur = (actuel.getFullYear() - pa) * 12 + (actuel.getMonth() + 1 - pm);
    }
    profondeur = Math.max(1, Math.min(11, profondeur)); // toujours au moins 2 points
    const out = [];
    for (let i = profondeur; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i + 1, 0); // dernier jour du mois visé
      const limite = i === 0 ? "9999-12-31" : d.toISOString().slice(0, 10);
      const idsComptes = new Set(comptes.map((c) => c.id));
      let valeur = socle;
      for (const t of transactions) {
        if (t.date > limite || t.horsSolde) continue;
        if (t.versId) {
          const val = Math.abs(t.montant);
          if (idsComptes.has(t.compteId)) valeur -= val;
          if (idsComptes.has(t.versId)) valeur += val;
        } else if (idsComptes.has(t.compteId)) {
          valeur += t.montant;
        }
      }
      out.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        valeur,
      });
    }
    return out;
  }, [comptes, transactions]);

  const moisActifs = useMemo(() => new Set(transactions.map((t) => t.date.slice(0, 7))).size, [transactions]);

  if (moisActifs < 2) {
    const valeurActuelle = points[points.length - 1]?.valeur || 0;
    return (
      <div className="rounded-ios bg-carte p-4 shadow-carte">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Évolution du patrimoine</h3>
          <span className="chiffres text-sm font-bold">{euros(valeurActuelle)}</span>
        </div>
        <p className="mt-1 text-xs text-sourdine">
          📈 La courbe apparaîtra dès ton deuxième mois d'utilisation — chaque fin de mois ajoutera un point.
        </p>
      </div>
    );
  }

  const vals = points.map((p) => p.valeur);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const amplitude = max - min || 1;
  const L = 320, H = 110, PAD = 8;
  const x = (i) => PAD + (i / (points.length - 1)) * (L - PAD * 2);
  const y = (v) => 12 + (1 - (v - min) / amplitude) * (H - 24);

  const chemin = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(" ");
  const aire = `${chemin} L${x(points.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const dernier = points[points.length - 1];
  const premier = points[0];
  const variation = dernier.valeur - premier.valeur;

  return (
    <div className="rounded-ios bg-carte p-4 shadow-carte">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold">Évolution du patrimoine</h3>
        <span className={`tnum text-sm font-bold ${variation >= 0 ? "text-menthe" : "text-corail"}`}>
          {variation >= 0 ? "+" : ""}{euros(variation)} sur {points.length - 1} mois
        </span>
      </div>
      <p className="mb-2 text-xs text-sourdine">Soldes cumulés de tes comptes en fin de mois (hors titres-resto).</p>
      <svg viewBox={`0 0 ${L} ${H + 16}`} className="w-full" role="img" aria-label="Évolution du patrimoine sur douze mois">
        <defs>
          <linearGradient id="grad-patrimoine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BB68C" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2BB68C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={aire} fill="url(#grad-patrimoine)" className="apparait-tard" />
        <path d={chemin} pathLength="1" className="trace-in" fill="none" stroke="#2BB68C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(dernier.valeur)} r="4" fill="#2BB68C" className="apparait-tard" />
        {points.map((p, i) =>
          i % 3 === 2 || i === points.length - 1 ? (
            <text key={i} x={x(i)} y={H + 12} textAnchor="middle" fontSize="10" fill="#7A8199">{p.label}</text>
          ) : null
        )}
      </svg>
      <div className="tnum flex justify-between text-xs text-sourdine">
        <span>Min : {euros(min)}</span>
        <span>Aujourd'hui : <span className="font-semibold text-encre">{euros(dernier.valeur)}</span></span>
      </div>
    </div>
  );
}
