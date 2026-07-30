"use client";

import { useState } from "react";
import { ICONES_ETENDUES, ICONES_RAPIDES } from "@/lib/icones";

export default function IconePicker({ icone, suggestion, personnalisee, onChoisirAuto, onChoisir }) {
  const [ouvert, setOuvert] = useState(false);
  const emojis = ouvert ? [...new Set([...ICONES_RAPIDES, ...ICONES_ETENDUES])] : ICONES_RAPIDES;

  return (
    <div className="rounded-ios border border-bordure bg-carte p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Icône de l&apos;opération</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fond text-xl" aria-label={`Icône choisie : ${icone || suggestion}`}>
          {icone || suggestion}
        </span>
      </div>
      <p className="mt-1 text-xs text-sourdine">
        {personnalisee ? "Choix personnalisé" : "Suggestion intelligente selon le libellé"}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChoisir(emoji)}
            aria-label={`Choisir ${emoji}`}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${icone === emoji ? "bg-marque-pale ring-2 ring-marque" : "bg-fond hover:scale-105"}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="rounded-xl bg-fond px-2.5 py-2 text-xs font-semibold text-sourdine"
        >
          {ouvert ? "Réduire" : "Tous les emojis"}
        </button>
        <button type="button" onClick={onChoisirAuto} className="rounded-xl bg-fond px-2.5 py-2 text-xs font-semibold text-sourdine">
          Auto
        </button>
        {ouvert && (
          <input
            value={personnalisee ? icone : ""}
            onChange={(e) => onChoisir(e.target.value)}
            placeholder="Autre…"
            aria-label="Saisir un autre emoji"
            className="min-w-0 flex-1 rounded-xl bg-fond px-2 text-center text-lg outline-none ring-1 ring-bordure focus:ring-marque"
          />
        )}
      </div>
      {ouvert && <p className="mt-2 text-[11px] text-sourdine">Tu peux aussi saisir ou coller n&apos;importe quel emoji Apple dans le champ « Autre… ».</p>}
    </div>
  );
}
