"use client";

import { useEffect, useRef, useState } from "react";
import { euros } from "@/lib/format";

export default function CountUp({ valeur, duree = 700, entier = false }) {
  const [affiche, setAffiche] = useState(valeur);
  const precedent = useRef(null);

  useEffect(() => {
    const depart = precedent.current === null ? 0 : precedent.current;
    precedent.current = valeur;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAffiche(valeur);
      return;
    }
    if (depart === valeur) { setAffiche(valeur); return; }
    let raf;
    const t0 = performance.now();
    const boucle = (t) => {
      const p = Math.min(1, (t - t0) / duree);
      const ease = 1 - Math.pow(1 - p, 3);
      setAffiche(depart + (valeur - depart) * ease);
      if (p < 1) raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [valeur, duree]);

  return <>{entier ? Math.round(affiche) : euros(affiche)}</>;
}
