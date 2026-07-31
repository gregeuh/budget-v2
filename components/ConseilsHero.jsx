"use client";

import { useMemo } from "react";
import { useBudget } from "@/lib/store";
import { calculerScore } from "@/lib/score";
import CountUp from "./CountUp";
import PeculeLogo from "./PeculeLogo";

const messagePour = (score) => {
  if (score.total >= 80) return "Voici tes priorités du jour pour garder le cap.";
  if (score.total >= 60) return "Voici tes priorités du jour pour consolider ta dynamique.";
  if (score.total >= 40) return "Voici tes priorités du jour pour améliorer ta situation.";
  return "Voici tes priorités du jour pour reprendre sereinement le cap.";
};

export default function ConseilsHero({ onVoirPriorites }) {
  const donnees = useBudget();
  const score = useMemo(
    () => calculerScore(donnees),
    [donnees.transactions, donnees.comptes, donnees.soldes, donnees.budgets, donnees.credits, donnees.recurrentes, donnees.profil]
  );
  const prenom = donnees.profil?.prenom?.slice(0, 20);

  return (
    <header className="relative px-1 pt-1">
      <div className="pointer-events-none absolute -top-12 left-1/2 h-32 w-72 -translate-x-1/2 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <PeculeLogo compact className="scale-90 origin-left" />
        <p className="text-v3-caption font-semibold uppercase tracking-[.14em] text-violet-500">Ton coach budgétaire</p>
        <button onClick={onVoirPriorites} aria-label="Voir mon score santé" className="flex h-9 min-w-9 items-center justify-center rounded-full border border-violet-200/80 bg-white/70 px-2 text-xs font-bold text-violet-600 shadow-v3-soft backdrop-blur-v3-glass">
          <CountUp valeur={score.total} duree={900} entier /><span className="ml-0.5 text-[9px] font-semibold text-violet-400">/100</span>
        </button>
      </div>
      <h1 className="relative mt-3 text-[clamp(2.25rem,10vw,3.35rem)] font-semibold leading-[.98] tracking-[-.055em] text-ui-text-primary">Bonjour{prenom ? ` ${prenom}` : ""} <span className="tracking-normal">✨</span></h1>
      <p className="relative mt-3 max-w-sm text-[17px] leading-relaxed text-ui-text-secondary">{messagePour(score)}</p>
    </header>
  );
}
