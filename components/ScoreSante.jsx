"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/lib/store";
import { calculerScore } from "@/lib/score";
import CountUp from "./CountUp";

export default function ScoreSante() {
  const donnees = useBudget();
  const [deplie, setDeplie] = useState(false);
  const [anime, setAnime] = useState(false);

  const score = useMemo(
    () => calculerScore(donnees),
    [donnees.transactions, donnees.comptes, donnees.soldes, donnees.budgets, donnees.credits, donnees.recurrentes, donnees.profil]
  );

  useEffect(() => {
    const t = setTimeout(() => setAnime(true), 80);
    return () => clearTimeout(t);
  }, []);

  const R = 44, C = 2 * Math.PI * R;
  const progression = anime ? score.total / 100 : 0;

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      <button onClick={() => setDeplie(!deplie)} className="flex w-full items-center gap-4 text-left" aria-expanded={deplie}>
        {/* Anneau */}
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 110 110" className="h-24 w-24 -rotate-90">
            <circle cx="55" cy="55" r={R} fill="none" stroke="var(--c-voile)" strokeWidth="11" />
            <circle
              cx="55" cy="55" r={R} fill="none"
              stroke={score.niveau.couleur}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progression)}
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.32, 0.72, 0, 1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="chiffres text-2xl font-bold leading-none">
              <CountUp valeur={score.total} duree={900} entier />
            </span>
            <span className="text-[10px] text-sourdine">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Score santé {score.niveau.emoji}</h2>
          <p className="text-sm font-semibold" style={{ color: score.niveau.couleur }}>{score.niveau.label}</p>
          <p className="mt-1 text-xs text-sourdine">
            Point faible : {score.faible.icone} {score.faible.label} ({score.faible.points}/20)
          </p>
        </div>
        <span className={`text-sourdine/50 transition-transform ${deplie ? "rotate-90" : ""}`}>›</span>
      </button>

      {deplie && (
        <div className="fade-in mt-3 space-y-2.5 border-t border-bordure pt-3">
          {score.piliers.map((p) => (
            <div key={p.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{p.icone} {p.label}</span>
                <span className="tnum text-sourdine">{p.points}/20</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-voile">
                <div
                  className="jauge-in h-full rounded-full"
                  style={{ width: `${(p.points / 20) * 100}%`, background: p.points >= 14 ? "var(--menthe)" : p.points >= 8 ? "var(--beurre)" : "var(--corail)" }}
                />
              </div>
              <p className="mt-0.5 text-xs text-sourdine">{p.detail}</p>
            </div>
          ))}
          <p className="rounded-2xl bg-ciel-pale px-3 py-2 text-xs text-ciel-texte">
            💡 {score.faible.conseil}
          </p>
        </div>
      )}
    </div>
  );
}
