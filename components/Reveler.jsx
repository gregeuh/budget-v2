"use client";

import { useEffect, useRef, useState } from "react";

// Révèle son contenu quand il entre dans l'écran (défilement vivant).
export default function Reveler({ children, retard = 0, className = "" }) {
  const ref = useRef(null);
  const [vu, setVu] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || vu) return;
    // Déjà visible au chargement : on révèle sans attendre le défilement
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVu(true);
          obs.disconnect();
        }
      },
      { rootMargin: "-40px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [vu]);

  return (
    <div ref={ref} className={`reveler ${vu ? "vu" : ""} ${className}`} style={{ transitionDelay: `${retard}ms` }}>
      {children}
    </div>
  );
}
