"use client";

import { useEffect, useRef, useState } from "react";
import FicheCompte from "./FicheCompte";
import { transitionPartagee } from "@/lib/transition";
import Link from "next/link";
import { useBudget } from "@/lib/store";
import { TYPES_COMPTE, COULEURS, euros, PLAFONDS } from "@/lib/format";
import Montant from "./Montant";
import CompteLogo from "./CompteLogo";

export default function CarrouselComptes({ onChange }) {
  const { comptes, soldes, transactions } = useBudget();
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
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4"
      >
        {cartes.map((c, i) => {
          const estTous = c.id === null;
          const t = estTous ? null : TYPES_COMPTE[c.type] || TYPES_COMPTE.autre;
          const coul = estTous ? null : COULEURS[t.couleur];
          const solde = estTous ? total : soldes[c.id] || 0;
          const dernierMouvement = estTous ? null : [...transactions]
            .filter((t) => t.compteId === c.id || t.versId === c.id)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          const plafond = !estTous && c.type === "livretA" ? PLAFONDS.livretA : !estTous && c.type === "ldds" ? PLAFONDS.ldds : null;
          return (
            <div
              key={c.id ?? "tous"}
              onClick={() => { if (!estTous && i === actif) transitionPartagee(() => setFiche(c)); }}
              role={estTous ? undefined : "button"}
              className={`carte-compte relative w-[86%] shrink-0 snap-center overflow-hidden rounded-v3-l p-5 shadow-v3-medium transition-[transform,opacity] duration-v3-normal ease-v3-standard ${!estTous && i === actif ? "cursor-pointer" : ""}`}
              style={{
                ...(estTous
                  ? { background: "linear-gradient(145deg, #3c2d8d 0%, #6954e8 58%, #a595ff 140%)" }
                  : {
                      background: `linear-gradient(145deg, color-mix(in srgb, ${coul.vif} 90%, #2b2350) 0%, ${coul.vif} 58%, color-mix(in srgb, ${coul.vif} 55%, white) 145%)`,
                      border: `1px solid color-mix(in srgb, ${coul.vif} 58%, white)`,
                    }),
                transform: i === actif ? "scale(1)" : "scale(0.93)",
                opacity: i === actif ? 1 : 0.55,
                viewTransitionName: !estTous && i === actif && !fiche ? "carte-active" : undefined,
              }}
            >
              <div className="reflet" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  {estTous ? <span className="flex h-10 w-10 items-center justify-center rounded-v3-xs bg-white/15 text-lg text-white backdrop-blur-v3-glass">✨</span> : <CompteLogo type={c.type} taille={40} />}
                  <span
                    className="rounded-pill bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-v3-glass"
                  >
                    {estTous ? `${comptes.length} comptes` : t.label}
                  </span>
                </div>
                {/* Puce dorée façon carte bancaire, discrète */}
                <div className="mt-4 flex items-center gap-1.5">
                  <span
                    className="h-4 w-5 rounded-[3px]"
                    style={{
                      background: estTous
                        ? "linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))"
                        : "linear-gradient(135deg, rgba(200,160,50,0.55), rgba(200,160,50,0.25))",
                    }}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: estTous ? "rgba(255,255,255,0.25)" : "var(--c-voile)" }}
                  />
                </div>
                  <div className="mt-6">
                    <Montant
                      valeur={solde}
                      className={`block font-bold leading-none text-white ${Math.abs(solde) >= 100000 ? "text-[25px]" : Math.abs(solde) >= 10000 ? "text-[30px]" : "text-[34px]"}`}
                  />
                  <div className="mt-1 flex items-center gap-1 text-[13px] text-white/75">
                    {estTous ? "Tous les comptes" : c.nom}
                    {!estTous && i === actif && <span className="text-white/60">›</span>}
                  </div>
                </div>
                {plafond && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                      <div className="jauge-in h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: coul.vif }} />
                    </div>
                    <p className="mt-1 text-[11px] text-white/70">{Math.max(0, Math.round((solde / plafond) * 100))} % du plafond</p>
                  </div>
                )}
                {!estTous && dernierMouvement && (
                  <p className="mt-3 truncate border-t border-white/15 pt-2 text-[11px] text-white/75">
                    Dernier mouvement · {dernierMouvement.libelle || "Opération"}
                  </p>
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
            className={`h-1.5 rounded-full transition-all duration-v3-normal ${i === actif ? "w-5 bg-ui-primary" : "w-1.5 bg-encre/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
