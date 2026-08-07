"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Sheet({ titre, onFermer, children, niveau = 1, clair = false }) {
  const [monte, setMonte] = useState(false);
  const feuilleRef = useRef(null);
  const fermerRef = useRef(null);
  const titreId = useId();

  // Rendu hors de la page (portail) : sinon l'animation de transition de page
  // crée un contexte d'empilement et la barre d'onglets passe par-dessus.
  useEffect(() => {
    setMonte(true);
    const scrollY = window.scrollY;
    const elementActifAvantOuverture = document.activeElement;
    const rendreChampVisible = (champ, delai = 0) => {
      if (!(champ instanceof HTMLElement) || !feuilleRef.current?.contains(champ)) return;

      window.setTimeout(() => {
        const feuille = feuilleRef.current;
        if (!feuille || !feuille.contains(champ)) return;

        // Sur Safari iOS, scrollIntoView peut déplacer le document derrière la
        // feuille. On ne défile donc que le conteneur de la feuille.
        const cadreFeuille = feuille.getBoundingClientRect();
        const cadreChamp = champ.getBoundingClientRect();
        const margeHaut = 84; // poignée + titre fixe
        const margeBas = 24;
        const hautVisible = cadreFeuille.top + margeHaut;
        const basVisible = cadreFeuille.bottom - margeBas;

        if (cadreChamp.top < hautVisible) {
          feuille.scrollTo({ top: Math.max(0, feuille.scrollTop - (hautVisible - cadreChamp.top)), behavior: "smooth" });
        } else if (cadreChamp.bottom > basVisible) {
          feuille.scrollTo({ top: feuille.scrollTop + (cadreChamp.bottom - basVisible), behavior: "smooth" });
        }
      }, delai);
    };

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
        // Après le resize du visualViewport, le clavier a fini son animation :
        // c'est ce second passage qui rend le champ réellement visible.
        rendreChampVisible(actif, 90);
      }
    };
    const gererFocus = (event) => {
      const champ = event.target;
      if (!(champ instanceof HTMLElement) || !feuilleRef.current?.contains(champ)) return;
      rendreChampVisible(champ, 220);
    };
    const gererClavier = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onFermer();
        return;
      }
      if (event.key !== "Tab" || !feuilleRef.current) return;
      const focusables = [...feuilleRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusables.length) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === premier) {
        event.preventDefault();
        dernier.focus();
      } else if (!event.shiftKey && document.activeElement === dernier) {
        event.preventDefault();
        premier.focus();
      }
    };
    actualiserViewport();
    window.visualViewport?.addEventListener("resize", actualiserViewport);
    window.visualViewport?.addEventListener("scroll", actualiserViewport);
    window.addEventListener("resize", actualiserViewport);
    document.addEventListener("focusin", gererFocus);
    document.addEventListener("keydown", gererClavier);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => fermerRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = "";
      window.visualViewport?.removeEventListener("resize", actualiserViewport);
      window.visualViewport?.removeEventListener("scroll", actualiserViewport);
      window.removeEventListener("resize", actualiserViewport);
      document.removeEventListener("focusin", gererFocus);
      document.removeEventListener("keydown", gererClavier);
      document.documentElement.style.removeProperty("--sheet-viewport");
      document.documentElement.style.removeProperty("--sheet-clavier");
      window.scrollTo(0, scrollY);
      if (elementActifAvantOuverture instanceof HTMLElement) elementActifAvantOuverture.focus();
    };
  }, []);

  if (!monte) return null;

  return createPortal(
    <div className="fixed inset-0 mx-auto max-w-md" style={{ zIndex: 100 + niveau * 5 }}>
      <div aria-hidden="true" className="voile-feuille absolute inset-0" onClick={onFermer} />
      <div
        ref={feuilleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        className={`sheet-in absolute inset-x-0 overflow-y-auto overscroll-contain rounded-t-[32px] px-4 pt-3 ${clair ? "bg-[#f8f9ff] text-[#101828]" : "bg-fond"}`}
        style={{
          bottom: "var(--sheet-clavier, 0px)",
          maxHeight: "min(92dvh, calc(var(--sheet-viewport, 100dvh) - 8px))",
          paddingBottom: "max(calc(var(--safe-bottom) + 24px), 24px)",
          scrollPaddingTop: "84px",
          scrollPaddingBottom: "32px",
          WebkitOverflowScrolling: "touch",
          overflowAnchor: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.16)",
        }}
      >
        <div className={`sticky top-0 z-20 -mx-4 mb-4 px-4 pt-0.5 pb-3 backdrop-blur-xl ${clair ? "bg-[#f8f9ff]/95" : "bg-fond/95"}`}>
          <div className={`mx-auto mb-3 h-1.5 w-9 rounded-full ${clair ? "bg-[#c9cedb]" : "bg-voile"}`} />
          <div className="flex items-center justify-between">
            <h2 id={titreId} className="text-lg font-bold">{titre}</h2>
            <button ref={fermerRef} type="button" onClick={onFermer} aria-label="Fermer" className={`flex h-10 w-10 items-center justify-center rounded-full text-xl shadow-sm ${clair ? "bg-white text-[#101828]" : "bg-voile text-sourdine"}`}>✕</button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
