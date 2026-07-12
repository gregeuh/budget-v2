"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Sheet({ titre, onFermer, children }) {
  const [monte, setMonte] = useState(false);

  // Rendu hors de la page (portail) : sinon l'animation de transition de page
  // crée un contexte d'empilement et la barre d'onglets passe par-dessus.
  useEffect(() => {
    setMonte(true);
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] mx-auto max-w-md">
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onFermer} />
      <div
        className="sheet-in absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[22px] bg-fond px-4 pt-3"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-voile" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titre}</h2>
          <button onClick={onFermer} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-voile text-sourdine">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
