"use client";

import { useEffect, useRef, useState } from "react";
import { useBudget } from "@/lib/store";

const SEUIL = 70;      // distance à parcourir pour déclencher
const MAX = 110;       // au-delà, la traction ne suit plus (effet élastique)

/**
 * Tirer vers le bas en haut de page pour rafraîchir.
 * Ne s'active qu'en haut du défilement et sur un geste vers le bas,
 * pour ne pas gêner le défilement normal.
 */
export default function TirerPourRafraichir() {
  const { rafraichir, notifier } = useBudget();
  const [tire, setTire] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const depart = useRef(null);
  const actif = useRef(false);
  // La distance vit dans une référence : sans cela, l'effet se réabonnerait
  // à chaque frame du geste (60 fois par seconde), ce qui saccaderait.
  const distance = useRef(0);
  const enCoursRef = useRef(false);

  useEffect(() => {
    const debut = (e) => {
      if (window.scrollY > 0 || enCoursRef.current) return;
      // Un seul doigt : on ignore les pincements
      if (e.touches.length !== 1) return;
      depart.current = e.touches[0].clientY;
      actif.current = false;
    };

    const bouge = (e) => {
      if (depart.current === null || enCoursRef.current) return;
      const delta = e.touches[0].clientY - depart.current;

      // Geste vers le haut ou page déjà défilée : on laisse faire le navigateur
      if (delta <= 0 || window.scrollY > 0) {
        depart.current = null;
        actif.current = false;
        distance.current = 0;
        setTire(0);
        return;
      }

      actif.current = true;
      // Résistance : plus on tire, plus ça freine
      const d = Math.min(MAX, delta * 0.5);
      distance.current = d;
      setTire(d);
    };

    const fin = async () => {
      if (depart.current === null) return;
      const parcourue = distance.current;
      depart.current = null;
      distance.current = 0;

      if (!actif.current || parcourue < SEUIL) {
        setTire(0);
        return;
      }

      enCoursRef.current = true;
      setEnCours(true);
      setTire(SEUIL);
      try {
        const postees = await rafraichir();
        notifier(
          postees > 0
            ? `${postees} échéance${postees > 1 ? "s" : ""} ajoutée${postees > 1 ? "s" : ""}`
            : "Tout est à jour",
          postees > 0 ? "🔁" : "✅"
        );
      } catch {
        notifier("Rafraîchissement impossible", "⚠️");
      } finally {
        enCoursRef.current = false;
        setEnCours(false);
        setTire(0);
      }
    };

    window.addEventListener("touchstart", debut, { passive: true });
    window.addEventListener("touchmove", bouge, { passive: true });
    window.addEventListener("touchend", fin, { passive: true });
    window.addEventListener("touchcancel", fin, { passive: true });
    return () => {
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", bouge);
      window.removeEventListener("touchend", fin);
      window.removeEventListener("touchcancel", fin);
    };
  }, [rafraichir, notifier]);

  if (tire === 0 && !enCours) return null;

  const progression = Math.min(1, tire / SEUIL);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center"
      style={{ paddingTop: `calc(var(--safe-top) + ${Math.round(tire * 0.4)}px)` }}
      aria-hidden="true"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-carte shadow-carte"
        style={{ opacity: progression, transform: `scale(${0.6 + progression * 0.4})` }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ transform: `rotate(${tire * 3}deg)` }}>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="var(--marque)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${progression * 57} 57`}
            className={enCours ? "tourne" : ""}
          />
        </svg>
      </div>
    </div>
  );
}
