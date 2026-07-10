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

  // Pile en flux normal : chaque carte remonte sur la précédente via une marge
  // négative. La hauteur du bloc est donc toujours exacte, sur tous les navigateurs.
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={deplie}
        onClick={() => setDeplie(!deplie)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDeplie(!deplie)}
        className="cursor-pointer select-none"
      >
        {comptes.map((c, i) => {
          const t = TYPES_COMPTE[c.type] || TYPES_COMPTE.autre;
          const coul = COULEURS[t.couleur];
          return (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-ios p-3.5 shadow-carte transition-[margin] duration-300"
              style={{
                marginTop: i === 0 ? 0 : deplie ? 10 : -62,
                background: `linear-gradient(135deg, ${coul.fond}, transparent 70%)`,
                backgroundColor: "var(--c-carte)",
                border: `1px solid ${coul.vif}22`,
                zIndex: i,
              }}
            >
              <div className="reflet" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: coul.vif + "26" }}>
                    {t.icone}
                  </span>
                  <div>
                    <div className="font-semibold leading-tight">{c.nom}</div>
                    <div className="text-xs" style={{ color: coul.texte }}>{t.label}</div>
                  </div>
                </div>
                <div className="chiffres text-lg font-bold">{euros(soldes[c.id] || 0)}</div>
              </div>
              {/* Réserve la zone visible de la carte du dessous quand la pile est repliée */}
              <div className={deplie ? "h-6" : "h-6"} />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-sourdine">
        {deplie ? "Toucher pour replier" : `${comptes.length} comptes · toucher pour déplier`}
      </p>
    </div>
  );
}
