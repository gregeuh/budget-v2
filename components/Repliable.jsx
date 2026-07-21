"use client";

import { useState } from "react";

/**
 * Bloc dépliable au style commun (même présentation que « Analyses » sur l'accueil).
 * Sert à mettre le contenu secondaire de côté sans l'enlever.
 */
export default function Repliable({ icone, titre, sousTitre, ouvertParDefaut = false, children }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  return (
    <div className="rounded-ios bg-carte p-3.5 shadow-carte">
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 text-left"
      >
        {icone && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-voile text-base">{icone}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{titre}</span>
          {sousTitre && <span className="block text-xs text-sourdine">{sousTitre}</span>}
        </span>
        <span className={`text-sourdine/50 transition-transform ${ouvert ? "rotate-90" : ""}`}>›</span>
      </button>

      {ouvert && (
        <div className="fade-in mt-3 border-t border-bordure pt-3">{children}</div>
      )}
    </div>
  );
}
