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
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-0"
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
          const accent = estTous ? "var(--marque)" : coul.vif;
          return (
            <div
              key={c.id ?? "tous"}
              onClick={() => { if (!estTous && i === actif) transitionPartagee(() => setFiche(c)); }}
              role={estTous ? undefined : "button"}
              className={`carte-compte compte-focus-card relative w-full shrink-0 snap-start overflow-hidden rounded-v3-l p-5 shadow-v3-medium transition-[transform,opacity] duration-v3-normal ease-v3-standard ${estTous ? "compte-focus-card--overview" : ""} ${!estTous && i === actif ? "cursor-pointer" : ""}`}
              style={{
                ...(estTous
                  ? { "--account-accent": accent }
                  : {
                      "--account-accent": accent,
                      "--account-tint": coul.fond,
                    }),
                transform: "scale(1)",
                opacity: 1,
                viewTransitionName: !estTous && i === actif && !fiche ? "carte-active" : undefined,
              }}
            >
              <div className="compte-focus-glow" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  {estTous ? <span className="compte-focus-icon flex h-10 w-10 items-center justify-center rounded-v3-xs text-lg">✨</span> : <span className="compte-focus-icon flex h-10 w-10 items-center justify-center rounded-v3-xs"><CompteLogo type={c.type} taille={32} /></span>}
                  <span
                    className="compte-focus-type rounded-pill px-2.5 py-1 text-[11px] font-semibold"
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
                        : "linear-gradient(135deg, color-mix(in srgb, var(--account-accent) 52%, white), color-mix(in srgb, var(--account-accent) 18%, transparent))",
                    }}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: estTous ? "rgba(255,255,255,0.25)" : "color-mix(in srgb, var(--account-accent) 38%, transparent)" }}
                  />
                </div>
                  <div className="mt-6">
                    <Montant
                      valeur={solde}
                      className={`compte-focus-amount block font-bold leading-none ${Math.abs(solde) >= 100000 ? "text-[25px]" : Math.abs(solde) >= 10000 ? "text-[30px]" : "text-[34px]"} ${solde < 0 ? "text-corail" : ""}`}
                  />
                  <div className="compte-focus-subtitle mt-1 flex items-center gap-1 text-[13px]">
                    {estTous ? "Tous les comptes" : c.nom}
                    {!estTous && i === actif && <span className="text-sourdine/50">›</span>}
                  </div>
                </div>
                {plafond && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-voile">
                      <div className="jauge-in h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (solde / plafond) * 100))}%`, background: accent }} />
                    </div>
                    <p className="compte-focus-subtitle mt-1 text-[11px]">{Math.max(0, Math.round((solde / plafond) * 100))} % du plafond</p>
                  </div>
                )}
                {!estTous && dernierMouvement && (
                  <p className="compte-focus-footer mt-3 truncate pt-2 text-[11px]">
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
