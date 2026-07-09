"use client";

import { useState } from "react";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, euros } from "@/lib/format";

export default function WalletStack() {
  const { comptes, soldes } = useBudget();
  const [deplie, setDeplie] = useState(false);

  if (comptes.length === 0) {
    return (
      <Link href="/comptes" className="block rounded-ios border-2 border-dashed border-bordure p-6 text-center text-sourdine">
        Ajoute ton premier compte →
      </Link>
    );
  }

  const HAUTEUR = 108;
  const CHEVAUCHEMENT = 46;
  const hauteurTotale = deplie
    ? comptes.length * (HAUTEUR + 10)
    : HAUTEUR + (comptes.length - 1) * CHEVAUCHEMENT;

  return (
    <button
      onClick={() => setDeplie(!deplie)}
      aria-expanded={deplie}
      className="relative block w-full text-left transition-all"
      style={{ height: hauteurTotale }}
    >
      {comptes.map((c, i) => {
        const t = TYPES_COMPTE[c.type] || TYPES_COMPTE.autre;
        const coul = COULEURS[t.couleur];
        const y = deplie ? i * (HAUTEUR + 10) : i * CHEVAUCHEMENT;
        const echelle = deplie ? 1 : 1 - (comptes.length - 1 - i) * 0.02;
        return (
          <div
            key={c.id}
            className="absolute inset-x-0 rounded-ios p-4 shadow-carte transition-transform duration-300"
            style={{
              height: HAUTEUR,
              transform: `translateY(${y}px) scale(${echelle})`,
              transformOrigin: "top center",
              background: `linear-gradient(135deg, ${coul.fond}, #FFFFFF)`,
              border: `1px solid ${coul.vif}22`,
              zIndex: i,
            }}
          >
            <div className="reflet" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                  style={{ background: coul.vif + "26" }}
                >
                  {t.icone}
                </span>
                <div>
                  <div className="font-semibold leading-tight">{c.nom}</div>
                  <div className="text-xs" style={{ color: coul.texte }}>{t.label}</div>
                </div>
              </div>
              <div className="chiffres text-lg font-bold">{euros(soldes[c.id] || 0)}</div>
            </div>
          </div>
        );
      })}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-sourdine">
        {deplie ? "Replier" : `${comptes.length} comptes — toucher pour déplier`}
      </div>
    </button>
  );
}
