"use client";

import { useEffect, useRef, useState } from "react";
import FicheCompte from "./FicheCompte";
import { transitionPartagee } from "@/lib/transition";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, euros, PLAFONDS } from "@/lib/format";

export default function CarrouselComptes({ onChange }) {
  const { comptes, soldes } = useBudget();
  const rail = useRef(null);
  const [actif, setActif] = useState(0);
  const [fiche, setFiche] = useState(null);

  const total = comptes.reduce((a, c) => a + (soldes[c.id] || 0), 0);
  const cartes = [{ id: null, nom: "Tous les comptes" }, ...comptes];

  // Carte active = celle au centre du rail
  const surDefilement = () => {
    const el = rail.current;
    if (!el || !el.firstElementChild) return;
    const largeur = el.firstElementChild.offsetWidth + 12; // + gap
    const idx = Math.max(0, Math.min(cartes.length - 1, Math.round(el.scrollLeft / largeur)));
    if (idx !== actif) setActif(idx);
  };

  useEffect(() => {
    onChange?.(cartes[actif]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, comptes.length]);

  if (comptes.length === 0) {
    return (
      <Link href="/comptes" className="block rounded-ios border-2 border-dashed border-bordure p-6 text-center text-sourdine">
        Ajoute ton premier compte →
      </Link>
    );
  }

  return (
    <div>
      <div
        ref={rail}
        onScroll={surDefilement}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4"
      >
        {cartes.map((c, i) => {
          const estTous = c.id === null;
          const t = estTous ? null : TYPES_COMPTE[c.type] || TYPES_COMPTE.autre;
          const coul = estTous ? null : COULEURS[t.couleur];
          const solde = estTous ? total : soldes[c.id] || 0;
          const plafond = !estTous && c.type === "livretA" ? PLAFONDS.livretA : !estTous && c.type === "ldds" ? PLAFONDS.ldds : null;
          return (
            <div
              key={c.id ?? "tous"}
              onClick={() => { if (!estTous && i === actif) transitionPartagee(() => setFiche(c)); }}
              role={estTous ? undefined : "button"}
              className={`relative w-[82%] shrink-0 snap-center overflow-hidden rounded-ios p-3.5 shadow-carte transition-[transform,opacity] duration-300 ${!estTous && i === actif ? "cursor-pointer" : ""}`}
              style={{
                ...(estTous
                  ? { background: "linear-gradient(135deg, #141A2B, #12805F)" }
                  : {
                      background: `linear-gradient(135deg, ${coul.fond}, transparent 70%)`,
                      backgroundColor: "var(--c-carte)",
                      border: `1px solid ${coul.vif}22`,
                    }),
                transform: i === actif ? "scale(1)" : "scale(0.93)",
                opacity: i === actif ? 1 : 0.55,
                viewTransitionName: !estTous && i === actif && !fiche ? "carte-active" : undefined,
              }}
            >
              <div className="reflet" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: estTous ? "rgba(255,255,255,0.15)" : coul.vif + "26" }}
                  >
                    {estTous ? "✨" : t.icone}
                  </span>
                  <span
                    className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${estTous ? "bg-white/15 text-white" : "bg-voile text-sourdine"}`}
                  >
                    {estTous ? `${comptes.length} comptes` : t.label}
                  </span>
                </div>
                <div className="mt-3">
                  <div className={`chiffres font-bold leading-none ${Math.abs(solde) >= 100000 ? "text-[22px]" : Math.abs(solde) >= 10000 ? "text-[26px]" : "text-[30px]"} ${estTous ? "text-white" : solde < 0 ? "text-corail" : ""}`}>
                    {euros(solde, { precis: true })}
                  </div>
                  <div className={`mt-0.5 flex items-center gap-1 text-[13px] ${estTous ? "text-white/70" : "text-sourdine"}`}>
                    {estTous ? "Tous les comptes" : c.nom}
                    {!estTous && i === actif && <span className="text-sourdine/50">›</span>}
                  </div>
                </div>
                {plafond && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-voile">
                      <div className="jauge-in h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: coul.vif }} />
                    </div>
                    <p className="mt-1 text-[11px] text-sourdine">{Math.max(0, Math.round((solde / plafond) * 100))} % du plafond</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {fiche && <FicheCompte compte={fiche} onFermer={() => transitionPartagee(() => setFiche(null))} />}

      {/* Points indicateurs */}
      <div className="mt-2 flex justify-center gap-1.5">
        {cartes.map((c, i) => (
          <span
            key={c.id ?? "tous"}
            className={`h-1.5 rounded-full transition-all ${i === actif ? "w-4 bg-encre" : "w-1.5 bg-encre/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
