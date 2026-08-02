"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Sheet({ titre, onFermer, children, niveau = 1, clair = false }) {
  const [monte, setMonte] = useState(false);
  const feuilleRef = useRef(null);

  // Rendu hors de la page (portail) : sinon l'animation de transition de page
  // crée un contexte d'empilement et la barre d'onglets passe par-dessus.
  useEffect(() => {
    setMonte(true);
    const scrollY = window.scrollY;
    const actualiserViewport = () => {
      const viewport = window.visualViewport;
      const hauteur = viewport?.height || window.innerHeight;
      // iOS conserve parfois la hauteur de la page derrière le clavier : on
      // remonte alors la feuille de la différence plutôt que de la laisser
      // passer sous le clavier natif.
      const clavier = Math.max(0, window.innerHeight - hauteur - (viewport?.offsetTop || 0));
      document.documentElement.style.setProperty("--sheet-viewport", `${Math.round(hauteur)}px`);
      document.documentElement.style.setProperty("--sheet-clavier", `${Math.round(clavier)}px`);

      const actif = document.activeElement;
      if (actif instanceof HTMLElement && feuilleRef.current?.contains(actif)) {
        window.setTimeout(() => actif.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }), 80);
      }
    };
    const rendreChampVisible = (event) => {
      const champ = event.target;
      if (!(champ instanceof HTMLElement) || !feuilleRef.current?.contains(champ)) return;
      window.setTimeout(() => champ.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }), 180);
    };
    actualiserViewport();
    window.visualViewport?.addEventListener("resize", actualiserViewport);
    window.visualViewport?.addEventListener("scroll", actualiserViewport);
    window.addEventListener("resize", actualiserViewport);
    document.addEventListener("focusin", rendreChampVisible);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.visualViewport?.removeEventListener("resize", actualiserViewport);
      window.visualViewport?.removeEventListener("scroll", actualiserViewport);
      window.removeEventListener("resize", actualiserViewport);
      document.removeEventListener("focusin", rendreChampVisible);
      document.documentElement.style.removeProperty("--sheet-viewport");
      document.documentElement.style.removeProperty("--sheet-clavier");
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div className="fixed inset-0 mx-auto max-w-md" style={{ zIndex: 100 + niveau * 5 }}>
      <div className="voile-feuille absolute inset-0" onClick={onFermer} />
      <div
        ref={feuilleRef}
        className={`sheet-in absolute inset-x-0 overflow-y-auto overscroll-contain rounded-t-[32px] px-4 pt-3 ${clair ? "bg-[#f8f9ff] text-[#101828]" : "bg-fond"}`}
        style={{
          bottom: "var(--sheet-clavier, 0px)",
          maxHeight: "min(92dvh, calc(var(--sheet-viewport, 100dvh) - 8px))",
          paddingBottom: "max(calc(var(--safe-bottom) + 24px), calc(var(--sheet-clavier, 0px) + 24px))",
          scrollPaddingBottom: "max(calc(var(--safe-bottom) + 32px), calc(var(--sheet-clavier, 0px) + 32px))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.16)",
        }}
      >
        <div className={`sticky top-0 z-20 -mx-4 mb-4 px-4 pt-0.5 pb-3 backdrop-blur-xl ${clair ? "bg-[#f8f9ff]/95" : "bg-fond/95"}`}>
          <div className={`mx-auto mb-3 h-1.5 w-9 rounded-full ${clair ? "bg-[#c9cedb]" : "bg-voile"}`} />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{titre}</h2>
            <button onClick={onFermer} aria-label="Fermer" className={`flex h-10 w-10 items-center justify-center rounded-full text-xl shadow-sm ${clair ? "bg-white text-[#101828]" : "bg-voile text-sourdine"}`}>✕</button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
