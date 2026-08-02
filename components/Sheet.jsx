"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Sheet({ titre, onFermer, children, niveau = 1, clair = false }) {
  const [monte, setMonte] = useState(false);

  // Rendu hors de la page (portail) : sinon l'animation de transition de page
  // crée un contexte d'empilement et la barre d'onglets passe par-dessus.
  useEffect(() => {
    setMonte(true);
    const scrollY = window.scrollY;
    const actualiserViewport = () => {
      const hauteur = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--sheet-viewport", `${Math.round(hauteur)}px`);
    };
    actualiserViewport();
    window.visualViewport?.addEventListener("resize", actualiserViewport);
    window.addEventListener("resize", actualiserViewport);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.visualViewport?.removeEventListener("resize", actualiserViewport);
      window.removeEventListener("resize", actualiserViewport);
      document.documentElement.style.removeProperty("--sheet-viewport");
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div className="fixed inset-0 mx-auto max-w-md" style={{ zIndex: 100 + niveau * 5 }}>
      <div className="voile-feuille absolute inset-0" onClick={onFermer} />
      <div
        className={`sheet-in absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain rounded-t-[32px] px-4 pt-3 ${clair ? "bg-[#f8f9ff] text-[#101828]" : "bg-fond"}`}
        style={{
          maxHeight: "min(92dvh, calc(var(--sheet-viewport, 100dvh) - 8px))",
          paddingBottom: "calc(var(--safe-bottom) + 24px)",
          scrollPaddingBottom: "calc(var(--safe-bottom) + 32px)",
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
